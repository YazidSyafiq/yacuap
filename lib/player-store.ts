/**
 * Pemutar musik: satu YouTube IFrame Player untuk seluruh situs, videonya tidak ditampilkan.
 * Kontrolnya tombol-tombol sendiri (daftar lagu dan bar pemutar di bawah layar).
 *
 * Disimpan di tingkat modul, bukan di state React, supaya lagu tetap jalan saat pindah halaman
 * dan semua tombol play membaca keadaan yang sama lewat `usePlayer`.
 * Modul ini hanya dipakai dari komponen klien.
 */
import { useSyncExternalStore } from "react";

export type PlayerTrack = {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  artwork: string | null;
};

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

export type PlayerState = {
  queue: PlayerTrack[];
  index: number;
  status: PlayerStatus;
  /** Detik yang sudah berjalan dan panjang lagu; 0 selama belum diketahui. */
  position: number;
  duration: number;
};

type YTPlayer = {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
};

type YTApi = {
  Player: new (
    element: HTMLElement,
    options: {
      width: number;
      height: number;
      playerVars: Record<string, number | string>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const EMPTY: PlayerState = { queue: [], index: -1, status: "idle", position: 0, duration: 0 };

let state: PlayerState = EMPTY;
const listeners = new Set<() => void>();

let player: YTPlayer | null = null;
let ready = false;
let requested = false;
/** Lagu yang diminta sebelum pemutar siap. */
let pendingId: string | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;
let watchdog: ReturnType<typeof setTimeout> | null = null;

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function startTicker() {
  if (ticker) return;
  ticker = setInterval(() => {
    if (!player || state.status !== "playing") return;
    const position = player.getCurrentTime() || 0;
    const duration = player.getDuration() || 0;
    if (Math.abs(position - state.position) >= 0.25 || duration !== state.duration) set({ position, duration });
  }, 500);
}

function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

function clearWatchdog() {
  if (watchdog) clearTimeout(watchdog);
  watchdog = null;
}

function load(youtubeId: string) {
  if (!player || !ready) {
    pendingId = youtubeId;
    prepare();
    return;
  }
  pendingId = null;
  player.loadVideoById(youtubeId);
  // Browser bisa menolak putar otomatis (terutama di HP kalau pemutarnya baru saja dibuat).
  // Kalau lagunya tidak kunjung jalan, tampilkan tombol play supaya bisa ditekan sekali lagi.
  clearWatchdog();
  watchdog = setTimeout(() => {
    if (state.status === "loading") set({ status: "paused" });
  }, 6000);
}

function onStateChange(code: number) {
  // pemutar sudah ditutup: abaikan kabar susulan dari YouTube
  if (state.index < 0) return;
  // 0 selesai, 1 main, 2 jeda, 3 memuat
  if (code === 1) {
    clearWatchdog();
    set({ status: "playing", duration: player?.getDuration() || 0 });
    startTicker();
  } else if (code === 2) {
    if (state.status !== "error") set({ status: "paused" });
  } else if (code === 3) {
    if (state.status !== "playing") set({ status: "loading" });
  } else if (code === 0) {
    next();
  }
}

/**
 * Menyiapkan pemutar: memuat IFrame API dan membuat iframe di luar layar.
 * Dipanggil begitu ada daftar lagu di halaman, supaya pemutar sudah siap saat tombol play ditekan
 * (di HP, putar hanya diizinkan kalau terjadi langsung di dalam sentuhan pengguna).
 */
export function prepare() {
  if (requested || typeof window === "undefined") return;
  requested = true;

  // Tidak boleh display:none, pemutarnya tidak jalan. Jadi 1x1 px, transparan, di pojok layar.
  const shell = document.createElement("div");
  shell.setAttribute("aria-hidden", "true");
  shell.style.cssText =
    "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;";
  const mount = document.createElement("div");
  shell.appendChild(mount);
  document.body.appendChild(shell);

  const create = () => {
    if (!window.YT) return;
    player = new window.YT.Player(mount, {
      width: 200,
      height: 200,
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0 },
      events: {
        onReady: () => {
          ready = true;
          if (pendingId) load(pendingId);
        },
        onStateChange: (event) => onStateChange(event.data),
        onError: () => {
          // 101 dan 150: pemilik video melarang diputar di luar YouTube
          clearWatchdog();
          set({ status: "error" });
        },
      },
    });
  };

  if (window.YT?.Player) {
    create();
    return;
  }
  const previous = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    previous?.();
    create();
  };
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  document.head.appendChild(script);
}

/** Memutar lagu ke-`index` dari `queue`. Kalau lagu itu yang sedang aktif, jadinya play/jeda. */
export function play(queue: PlayerTrack[], index: number) {
  const track = queue[index];
  if (!track) return;
  const current = state.queue[state.index];
  if (current && current.id === track.id && state.status !== "error") {
    set({ queue, index });
    toggle();
    return;
  }
  set({ queue, index, status: "loading", position: 0, duration: 0 });
  load(track.youtubeId);
}

export function toggle() {
  const track = state.queue[state.index];
  if (!track) return;
  if (!player || !ready) {
    set({ status: "loading" });
    load(track.youtubeId);
    return;
  }
  if (state.status === "playing" || state.status === "loading") {
    player.pauseVideo();
    clearWatchdog();
    set({ status: "paused" });
  } else {
    player.playVideo();
  }
}

export function next() {
  if (state.index < state.queue.length - 1) {
    const index = state.index + 1;
    set({ index, status: "loading", position: 0, duration: 0 });
    load(state.queue[index].youtubeId);
  } else {
    // lagu terakhir selesai: berhenti di sini, bar tetap ada supaya bisa diputar lagi
    player?.pauseVideo();
    set({ status: "paused", position: 0 });
  }
}

export function previous() {
  // seperti pemutar pada umumnya: kalau lagunya sudah jalan beberapa detik, ulang dari awal dulu
  if (state.position > 3 || state.index <= 0) {
    player?.seekTo(0, true);
    set({ position: 0 });
    return;
  }
  const index = state.index - 1;
  set({ index, status: "loading", position: 0, duration: 0 });
  load(state.queue[index].youtubeId);
}

/** Lompat ke bagian lagu, `fraction` antara 0 dan 1. */
export function seek(fraction: number) {
  if (!player || !ready || state.duration <= 0) return;
  const position = Math.min(Math.max(fraction, 0), 1) * state.duration;
  player.seekTo(position, true);
  set({ position });
}

/** Menghentikan musik dan menutup bar pemutar. */
export function close() {
  clearWatchdog();
  stopTicker();
  pendingId = null;
  if (player && ready) player.stopVideo();
  set(EMPTY);
}

const getState = () => state;
const getServerState = () => EMPTY;

export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

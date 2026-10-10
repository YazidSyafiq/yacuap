"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { movementOf } from "@/lib/chart";
import { play, prepare, usePlayer } from "@/lib/player-store";
import type { PlaylistTrack } from "@/lib/playlist";
import { Equalizer, PauseIcon, PlayIcon, Spinner } from "./icons";

/**
 * Tombol "putar dari awal" untuk satu playlist.
 * Kalau antrean playlist ini (dikenali dari `queueId`) yang sedang jalan, tombolnya jadi jeda / lanjut.
 */
export function PlayAllButton({ tracks, queueId, block = false }: { tracks: PlaylistTrack[]; queueId: string; block?: boolean | "sm" }) {
  const player = usePlayer();
  const mine = player.queueId === queueId && player.index >= 0;
  const playing = mine && (player.status === "playing" || player.status === "loading");

  return (
    <button
      type="button"
      className={buttonClass("primary", "md", undefined, block)}
      onClick={() => play(tracks, mine ? player.index : 0, queueId)}
      disabled={tracks.length === 0}
    >
      {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      {playing ? "Jeda dulu" : mine ? "Lanjutin lagi" : "Putar dari awal"}
    </button>
  );
}

/**
 * Catatan kenapa lagu itu masuk. Seperti caption Instagram: kalau tidak muat sebaris,
 * dipotong dengan "selengkapnya" di ujungnya; ditekan, catatannya tampil utuh.
 */
export function TrackNote({
  note,
  compact = false,
  quote = false,
  muted = false,
  className,
}: {
  note: string;
  compact?: boolean;
  /** Gaya kartu ocehan: tanda kutip besar pudar di kiri atas, teks Fraunces miring. */
  quote?: boolean;
  /** Warna redup, sama dengan nama artis. */
  muted?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Diukur terhadap lebar kotaknya (bukan lebar teks yang sudah terpotong), dan diulang saat layar berubah.
  // Hanya diukur selagi terlipat: saat terbuka teksnya tidak terpotong, jadi hasil ukurnya tidak berlaku.
  useEffect(() => {
    if (open) return;
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(() => {
      const text = textRef.current;
      if (text) setOverflows(text.scrollWidth > box.clientWidth);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [open]);

  // tinggi baris tombol mengikuti tinggi baris teks (dalam px), supaya baris pertama tidak bergeser saat tombol pindah baris
  const toggle = "relative z-10 shrink-0 font-ui text-sm font-semibold not-italic leading-[inherit] text-ink hover:underline";

  return (
    <div
      ref={boxRef}
      className={cn(
        "italic",
        quote
          ? "relative pl-6 pt-0.5 font-display text-[16px] leading-[22px] text-muted"
          : cn("font-body", muted ? "text-muted" : "text-ink-soft", compact ? "mt-0.5 text-[15px] leading-[21px]" : "mt-1.5 text-[17px] leading-[24px]"),
        className,
      )}
    >
      {quote ? (
        <span aria-hidden="true" className="pointer-events-none absolute -top-3 left-0 select-none font-display text-[3.25rem] not-italic leading-none text-line">
          &ldquo;
        </span>
      ) : null}
      {/* terlipat: baris flex, teks terpotong, tombol di ujung; terbuka: teks mengalir biasa dengan "tutup" tepat di akhir kalimat.
          Tinggi barisnya sama dalam piksel di kedua keadaan, jadi baris pertama catatan tidak bergeser */}
      <div className={open ? "block" : "flex flex-nowrap items-start gap-x-2"}>
        <span ref={textRef} className={open ? undefined : "min-w-0 truncate"}>
          {note}
        </span>
        {open ? (
          <>
            {" "}
            <button type="button" onClick={() => setOpen(false)} className={toggle}>
              tutup
            </button>
          </>
        ) : overflows ? (
          <button type="button" onClick={() => setOpen(true)} aria-label="Lihat catatan selengkapnya" className={toggle}>
            selengkapnya
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Lencana gerak sebuah lagu di chart dibanding minggu lalu, ringkas seperti chart musik: segitiga ke atas dengan
 * selisihnya, segitiga ke bawah dengan selisihnya, garis untuk tetap, atau pil penuh "Baru". Dipakai di situs dan admin.
 */
export function MovementBadge({ position, lastPosition, className }: { position: number; lastPosition: number | null; className?: string }) {
  const move = movementOf(position, lastPosition);
  const base = "inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full px-2 font-ui text-xs font-semibold tabular-nums";
  if (move.kind === "new") {
    return (
      <span className={cn(base, "bg-ink uppercase tracking-[0.06em] text-bg", className)}>
        Baru
      </span>
    );
  }
  if (move.kind === "same") {
    return (
      <span className={cn(base, "border border-border-strong text-muted", className)} aria-label="Tetap">
        <svg aria-hidden="true" width="10" height="4" viewBox="0 0 10 4" fill="currentColor">
          <rect width="10" height="2.5" rx="1.25" />
        </svg>
      </span>
    );
  }
  const up = move.kind === "up";
  return (
    <span className={cn(base, "border", up ? "border-ink text-ink" : "border-border-strong text-muted", className)} aria-label={`${up ? "Naik" : "Turun"} ${move.delta}`}>
      <svg aria-hidden="true" width="9" height="9" viewBox="0 0 10 10" fill="currentColor">{up ? <path d="M5 1l4 6H1z" /> : <path d="M5 9L1 3h8z" />}</svg>
      {move.delta}
    </span>
  );
}

/** Sel "Minggu lalu" di kolom tabel: angka posisi minggu lalu yang besar dan redup, lencana geraknya di bawah. */
export function LastWeekCell({ position, lastPosition, className }: { position: number; lastPosition: number | null; className?: string }) {
  return (
    <span className={cn("flex flex-col items-center justify-center gap-1", className)}>
      {lastPosition != null ? (
        <span className="font-display text-[1.75rem] font-medium tabular-nums leading-none text-muted">{lastPosition}</span>
      ) : null}
      <MovementBadge position={position} lastPosition={lastPosition} />
    </span>
  );
}

const addedDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
/** "30 Sep 2026": tanggal lagu pertama disimpan, keterangan tambahan di daftar playlist. */
const addedLabel = (iso: string) => addedDate.format(new Date(iso));

/** Lama bertahan di chart: "baru masuk" untuk minggu pertama, selebihnya "n minggu". */
const weeksLabel = (weeks: number, lastPosition: number | null) => (lastPosition == null || weeks <= 1 ? "baru masuk" : `${weeks} minggu`);

/** Sampul dengan tombol putar di atasnya. `spread` merentangkan area tekannya ke seluruh baris induk. */
function ArtworkButton({ track, state, onPlay, spread = false, size = "md" }: { track: PlaylistTrack; state: "idle" | "playing" | "loading" | "active"; onPlay: () => void; spread?: boolean; size?: "sm" | "md" }) {
  const playing = state === "playing";
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`${playing ? "Jeda" : "Putar"} ${track.title}${track.artist ? `, ${track.artist}` : ""}`}
      aria-pressed={playing}
      className={cn("shrink-0 rounded-xl", spread && "after:absolute after:inset-0")}
    >
      <span className={cn("relative block overflow-hidden rounded-xl bg-(--cover)", size === "sm" ? "size-14" : "size-16")}>
        {track.artwork ? <Image src={track.artwork} alt="" fill sizes="64px" unoptimized className="mono-img object-cover transition-transform duration-300 group-hover:scale-105" /> : null}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className={cn("flex size-8 items-center justify-center rounded-full bg-ink text-bg transition-opacity", state !== "idle" ? "opacity-100" : "opacity-85 group-hover:opacity-100")}>
            {state === "loading" ? <Spinner className="size-4" /> : playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4 translate-x-px" />}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Daftar lagu sebuah playlist atau chart. Dua susunan yang tegas:
 * - HP: kartu per lagu (mockup Opsi B): posisi, sampul, judul utuh, artis; catatan bergaya kartu ocehan
 *   (satu baris, "selengkapnya" untuk membukanya); untuk chart, baris pil gerak dan lama bertahan.
 * - layar lebar: tabel di dalam kartu putih seperti mockup, dengan kepala kolom untuk chart.
 * Lagu yang sedang jalan dari antrean ini diberi penanda.
 */
export function TrackList({
  tracks,
  queueId,
  limit,
  chart = false,
  footer,
  className,
}: {
  tracks: PlaylistTrack[];
  /** Id playlist atau "chart", jadi penanda antrean di pemutar. */
  queueId: string;
  /** Jumlah baris yang ditampilkan. Antrean pemutarnya tetap seluruh `tracks`. */
  limit?: number;
  chart?: boolean;
  /** Baris kaki, misalnya "Ini baru 5 dari 20 lagu." */
  footer?: React.ReactNode;
  className?: string;
}) {
  const player = usePlayer();
  const currentId = player.queueId === queueId ? player.queue[player.index]?.id : undefined;

  // pemutar disiapkan begitu daftar lagu tampil, supaya sudah siap saat tombol play ditekan
  useEffect(() => {
    if (tracks.length > 0) prepare();
  }, [tracks.length]);

  const shown = limit ? tracks.slice(0, limit) : tracks;
  const stateOf = (track: PlaylistTrack): "idle" | "playing" | "loading" | "active" => {
    if (track.id !== currentId) return "idle";
    if (player.status === "playing") return "playing";
    if (player.status === "loading") return "loading";
    return "active";
  };
  const columns = chart ? "sm:grid-cols-[48px_64px_minmax(0,1fr)_120px_88px]" : "sm:grid-cols-[48px_64px_minmax(0,1fr)_112px]";
  const head = "font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";
  const footerRow = footer ? <div className="border-t border-line px-4 py-4 text-center font-ui text-sm text-muted sm:px-6 sm:py-3">{footer}</div> : null;

  return (
    <div className={className}>
      {/* HP: satu kartu, tiap lagu satu bagian yang dipisah garis */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface sm:hidden">
        <ol className="flex flex-col">
          {shown.map((track, i) => {
            const state = stateOf(track);
            const position = i + 1;
            return (
              <li key={track.id} className="group flex flex-col gap-3.5 border-b border-line px-4 py-6 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className={cn("w-9 shrink-0 text-center font-display font-semibold leading-none tracking-[-0.02em]", chart ? "text-[2.25rem]" : "text-[1.75rem] text-muted")}>
                    {position}
                  </span>
                  <ArtworkButton track={track} state={state} size="sm" onPlay={() => play(tracks, i, queueId)} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-ui text-[16px] font-semibold leading-[1.3]">{track.title}</span>
                      {state !== "idle" ? <Equalizer paused={state !== "playing"} className="shrink-0" /> : null}
                    </div>
                    {track.artist ? <span className="font-ui text-[13px] text-muted">{track.artist}</span> : null}
                  </div>
                </div>
                {track.note ? <TrackNote note={track.note} quote /> : null}
                {chart ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <MovementBadge position={position} lastPosition={track.lastPosition} />
                    <span className="font-ui text-xs font-medium text-muted">
                      {track.lastPosition == null ? "baru masuk minggu ini" : `minggu lalu di ${track.lastPosition}, ${track.weeks <= 1 ? "baru masuk" : `bertahan ${track.weeks} minggu`}`}
                    </span>
                  </div>
                ) : (
                  <span className="font-ui text-xs font-medium text-muted">Ditambahkan {addedLabel(track.addedAt)}</span>
                )}
              </li>
            );
          })}
        </ol>
        {footerRow}
      </div>

      {/* layar lebar: tabel di dalam kartu */}
      <div className="hidden overflow-hidden rounded-3xl border border-border-strong bg-surface sm:block">
        <div className={cn("grid items-center gap-4 border-b border-line px-6 py-3", columns)}>
          <span className={cn(head, "text-center")}>{chart ? "Posisi" : "Urutan"}</span>
          <span />
          <span className={head}>Lagu</span>
          {chart ? (
            <>
              <span className={cn(head, "text-center")}>Minggu lalu</span>
              <span className={cn(head, "text-right")}>Bertahan</span>
            </>
          ) : (
            <span className={cn(head, "text-right")}>Ditambahkan</span>
          )}
        </div>
        <ol className="flex flex-col">
          {shown.map((track, i) => {
            const state = stateOf(track);
            const position = i + 1;
            return (
              <li key={track.id} className={cn("group relative grid items-start gap-x-4 border-b border-line px-6 py-4 last:border-b-0", columns)}>
                {/* rata atas dengan jarak tetap per sel: saat catatan dibuka, hanya catatannya yang memanjang ke bawah */}
                <span aria-hidden="true" className={cn("flex h-16 items-center justify-center font-display font-medium tabular-nums leading-none", chart ? "text-[1.875rem] text-ink" : cn("text-[1.75rem]", state !== "idle" ? "text-ink" : "text-muted"))}>
                  {position}
                </span>
                {/* tombol play-nya sampul, tapi area tekannya direntangkan ke seluruh baris */}
                <ArtworkButton track={track} state={state} spread onPlay={() => play(tracks, i, queueId)} />
                {/* ada catatan: judul dan artis rata atas sejajar sampul, catatan italic redup di bawahnya (gaya 1 mockup);
                    tanpa catatan: judul dan artis di tengah tinggi sampul. Sel lain tetap 64px, jadi tidak bergeser saat catatan dibuka */}
                <div className={cn("flex min-w-0 flex-col gap-0.5", track.note ? "pt-0.5" : "min-h-16 justify-center")}>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 truncate font-ui text-[17px] font-semibold leading-snug">{track.title}</span>
                    {state !== "idle" ? <Equalizer paused={state !== "playing"} className="shrink-0" /> : null}
                  </div>
                  {track.artist ? <span className="truncate font-ui text-sm text-muted">{track.artist}</span> : null}
                  {track.note ? <TrackNote note={track.note} compact muted /> : null}
                </div>
                {chart ? (
                  <LastWeekCell position={position} lastPosition={track.lastPosition} className="h-16" />
                ) : null}
                {chart ? (
                  <span className="flex h-16 items-center justify-end font-ui text-[13px] text-muted">{weeksLabel(track.weeks, track.lastPosition)}</span>
                ) : (
                  <span className="flex h-16 items-center justify-end font-ui text-[13px] text-muted">{addedLabel(track.addedAt)}</span>
                )}

              </li>
            );
          })}
        </ol>
        {footerRow}
      </div>
    </div>
  );
}

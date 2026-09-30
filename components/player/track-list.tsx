"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { play, prepare, usePlayer } from "@/lib/player-store";
import type { PlaylistTrack } from "@/lib/playlist";
import { Equalizer, PauseIcon, PlayIcon, Spinner } from "./icons";

/**
 * Tombol "putar dari awal" untuk satu playlist.
 * Kalau playlist ini yang sedang jalan, tombolnya jadi jeda / lanjut.
 */
export function PlayAllButton({ tracks }: { tracks: PlaylistTrack[] }) {
  const { queue, index, status } = usePlayer();
  const current = queue[index];
  const position = current ? tracks.findIndex((track) => track.id === current.id) : -1;
  const mine = position >= 0;
  const playing = mine && (status === "playing" || status === "loading");

  return (
    <button
      type="button"
      className={buttonClass("primary", "md")}
      onClick={() => play(tracks, mine ? position : 0)}
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
export function TrackNote({ note, className }: { note: string; className?: string }) {
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

  const toggle = "relative z-10 shrink-0 font-ui text-sm font-semibold not-italic text-ink hover:underline";

  return (
    <div ref={boxRef} className={cn("mt-1.5 font-body text-[17px] italic leading-snug text-ink-soft", className)}>
      {/* elemennya sama saat terlipat dan terbuka, hanya kelasnya yang berganti */}
      <div className={open ? undefined : "flex items-baseline gap-2"}>
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
 * Daftar lagu sebuah playlist. Seluruh baris bisa ditekan untuk memutar: sampul, judul, artis,
 * dan catatan kenapa lagu itu masuk. Lagu yang sedang jalan diberi penanda.
 */
export function TrackList({
  tracks,
  limit,
  className,
}: {
  tracks: PlaylistTrack[];
  /** Jumlah baris yang ditampilkan. Antrean pemutarnya tetap seluruh `tracks`. */
  limit?: number;
  className?: string;
}) {
  const { queue, index, status } = usePlayer();
  const currentId = queue[index]?.id;

  // pemutar disiapkan begitu daftar lagu tampil, supaya sudah siap saat tombol play ditekan
  useEffect(() => {
    if (tracks.length > 0) prepare();
  }, [tracks.length]);

  return (
    <ol className={cn("flex flex-col border-t border-line", className)}>
      {(limit ? tracks.slice(0, limit) : tracks).map((track, i) => {
        const active = track.id === currentId;
        const playing = active && status === "playing";
        const loading = active && status === "loading";
        return (
          <li key={track.id} className="group relative flex items-start gap-4 border-b border-line py-4 sm:gap-5">
            <span
              aria-hidden="true"
              className={cn(
                "hidden w-7 shrink-0 pt-3.5 font-display text-lg tabular-nums sm:block",
                active ? "text-ink" : "text-muted",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {/* tombol play-nya sampul, tapi area tekannya direntangkan ke seluruh baris (after:inset-0) */}
            <button
              type="button"
              onClick={() => play(tracks, i)}
              aria-label={`${playing ? "Jeda" : "Putar"} ${track.title}${track.artist ? `, ${track.artist}` : ""}`}
              aria-pressed={playing}
              className="shrink-0 rounded-xl after:absolute after:inset-0"
            >
              <span className="relative block size-14 overflow-hidden rounded-xl bg-(--cover) sm:size-16">
                {track.artwork ? (
                  <Image
                    src={track.artwork}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized
                    className="mono-img object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full bg-ink text-bg transition-opacity",
                      active ? "opacity-100" : "opacity-85 group-hover:opacity-100",
                    )}
                  >
                    {loading ? (
                      <Spinner className="size-4" />
                    ) : playing ? (
                      <PauseIcon className="size-4" />
                    ) : (
                      <PlayIcon className="size-4 translate-x-px" />
                    )}
                  </span>
                </span>
              </span>
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:pt-0.5">
              <div className="flex items-center gap-2.5">
                <span className="truncate font-ui text-[17px] font-semibold leading-snug">{track.title}</span>
                {active ? <Equalizer paused={!playing} className="shrink-0" /> : null}
              </div>
              {track.artist ? <span className="truncate font-ui text-sm text-muted">{track.artist}</span> : null}
              {track.note ? <TrackNote note={track.note} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

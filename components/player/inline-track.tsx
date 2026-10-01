"use client";

import Image from "next/image";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { play, prepare, usePlayer, type PlayerTrack } from "@/lib/player-store";
import { Equalizer, PauseIcon, PlayIcon, Spinner } from "./icons";

/**
 * Kartu lagu di dalam tulisan: sampul, judul, artis, dan tombol putar yang memakai pemutar situs
 * (bar di bawah layar), jadi lagunya tetap jalan sambil pembaca lanjut membaca.
 * Dipakai juga sebagai tampilan di editor (tanpa tombol yang berfungsi).
 */
export function InlineTrack({ track, interactive = true }: { track: PlayerTrack; interactive?: boolean }) {
  const { queue, index, status } = usePlayer();
  const active = queue[index]?.id === track.id;
  const playing = active && status === "playing";
  const loading = active && status === "loading";

  useEffect(() => {
    if (interactive) prepare();
  }, [interactive]);

  return (
    <div className="track-card not-prose my-[1.6em] flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 pr-4 font-ui text-base not-italic sm:p-4 sm:pr-5">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--cover)">
        {track.artwork ? <Image src={track.artwork} alt="" fill sizes="64px" unoptimized className="mono-img object-cover" /> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2.5">
          <span className="truncate text-[16px] font-semibold leading-snug">{track.title}</span>
          {active ? <Equalizer paused={!playing} className="shrink-0" /> : null}
        </span>
        {track.artist ? <span className="truncate text-sm text-muted">{track.artist}</span> : null}
        <span className="text-xs text-muted">Putar sambil baca</span>
      </span>
      <button
        type="button"
        onClick={interactive ? () => play([track], 0) : undefined}
        tabIndex={interactive ? 0 : -1}
        aria-label={`${playing ? "Jeda" : "Putar"} ${track.title}`}
        aria-pressed={playing}
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-bg", !interactive && "pointer-events-none")}
      >
        {loading ? <Spinner className="size-5" /> : playing ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5 translate-x-px" />}
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { Container } from "@/components/ui/container";
import { close, next, previous, seek, toggle, usePlayer } from "@/lib/player-store";
import { CloseIcon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, Spinner } from "./icons";

function clock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const control = "flex size-10 shrink-0 items-center justify-center rounded-full text-bg/80 hover:text-bg";

/**
 * Bar pemutar di bawah layar. Hanya muncul kalau ada lagu yang dipilih, dan tetap ada saat pindah halaman.
 * Warnanya kebalikan dari tema, sama seperti footer. Musiknya dari YouTube, videonya tidak ditampilkan.
 */
export function PlayerBar() {
  const { queue, index, status, position, duration } = usePlayer();
  const track = queue[index];
  if (!track) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const busy = status === "loading";
  const failed = status === "error";

  const onSeek = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    seek((event.clientX - box.left) / box.width);
  };

  return (
    <>
      {/* pengganjal setinggi bar, supaya ujung halaman tidak tertutup */}
      <div aria-hidden="true" className="h-[72px] shrink-0" />
      <section
        aria-label="Pemutar musik"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-bg/15 bg-ink text-bg"
      >
        {/* garis kemajuan lagu; areanya dibuat lebih tinggi dari garisnya supaya gampang ditekan */}
        <div onPointerDown={onSeek} className="absolute inset-x-0 -top-2 flex h-4 cursor-pointer items-center">
          <div className="h-[3px] w-full bg-bg/20">
            <div className="h-full bg-bg" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <Container className="flex h-[72px] items-center gap-3 sm:gap-4">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-bg/15">
            {track.artwork ? (
              <Image src={track.artwork} alt="" fill sizes="44px" unoptimized className="mono-img object-cover" />
            ) : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col" aria-live="polite">
            <span className="truncate font-ui text-[15px] font-semibold leading-snug">{track.title}</span>
            {failed ? (
              <span className="truncate font-ui text-[13px] text-bg/70">
                Yah, yang ini nggak bisa diputar di sini.{" "}
                <a
                  href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-bg"
                >
                  Dengerin di YouTube aja
                </a>
              </span>
            ) : (
              <span className="truncate font-ui text-[13px] text-bg/70">{track.artist || "Lagi diputar"}</span>
            )}
          </div>
          <span className="hidden font-ui text-[13px] tabular-nums text-bg/70 md:block">
            {clock(position)} / {duration > 0 ? clock(duration) : "-:--"}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button type="button" onClick={previous} aria-label="Lagu sebelumnya" className={`${control} hidden sm:flex`}>
              <PreviousIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={toggle}
              aria-label={status === "playing" || busy ? "Jeda" : "Putar"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bg text-ink"
            >
              {busy ? (
                <Spinner className="size-5" />
              ) : status === "playing" ? (
                <PauseIcon className="size-5" />
              ) : (
                <PlayIcon className="size-5 translate-x-px" />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Lagu berikutnya"
              disabled={index >= queue.length - 1}
              className={`${control} disabled:opacity-35`}
            >
              <NextIcon className="size-5" />
            </button>
            <button type="button" onClick={close} aria-label="Tutup pemutar" className={control}>
              <CloseIcon className="size-5" />
            </button>
          </div>
        </Container>
      </section>
    </>
  );
}

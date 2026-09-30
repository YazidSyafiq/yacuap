import Image from "next/image";
import Link from "next/link";
import { PlayAllButton, TrackList } from "@/components/player/track-list";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Playlist } from "@/lib/playlist";

/**
 * Sampul playlist, dirangkai dari sampul lagu-lagunya: empat kotak kalau lagunya cukup,
 * satu gambar kalau belum. Semuanya sudah monokrom dari server.
 */
export function PlaylistCover({ playlist, className }: { playlist: Playlist; className?: string }) {
  const artworks = playlist.tracks.flatMap((track) => (track.artwork ? [track.artwork] : []));
  const tiles = artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid aspect-square shrink-0 overflow-hidden rounded-2xl bg-(--cover) lg:rounded-3xl",
        tiles.length === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1",
        className,
      )}
    >
      {tiles.map((src) => (
        <span key={src} className="relative">
          <Image src={src} alt="" fill sizes="(min-width: 1024px) 220px, 120px" unoptimized className="mono-img object-cover" />
        </span>
      ))}
    </div>
  );
}

/**
 * Satu playlist utuh: sampul, nama, keterangan, tombol putar, lalu daftar lagunya.
 * Dipakai di bagian Playlist beranda (dengan `limit`) dan di halaman /playlist (semua lagu).
 */
export function PlaylistShowcase({
  playlist,
  limit,
  titleAs: Title = "h3",
}: {
  playlist: Playlist;
  /** Jumlah lagu yang ditampilkan; sisanya lewat tautan ke /playlist. */
  limit?: number;
  titleAs?: "h2" | "h3";
}) {
  const rest = limit ? Math.max(playlist.tracks.length - limit, 0) : 0;

  // grid-cols-1 wajib: tanpa itu kolom di HP melebar mengikuti catatan lagu yang sebaris, dan halaman jadi meluber
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
      {/* di layar lebar kolom ini ikut menempel saat daftar lagunya digulir */}
      <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
        <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:gap-6">
          <PlaylistCover playlist={playlist} className="w-28 sm:w-40 lg:w-full lg:max-w-[380px]" />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="font-ui text-[13px] font-medium text-muted">Isinya {playlist.tracks.length} lagu</p>
            <Title className="font-display text-[1.75rem] font-medium leading-tight sm:text-4xl">{playlist.name}</Title>
            {playlist.description ? (
              <p className="hidden text-[17px] leading-relaxed text-muted sm:block">{playlist.description}</p>
            ) : null}
          </div>
        </div>
        {playlist.description ? (
          <p className="text-[17px] leading-relaxed text-muted sm:hidden">{playlist.description}</p>
        ) : null}
        <PlayAllButton tracks={playlist.tracks} />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        {/* antrean pemutar selalu seluruh playlist, walau yang tampil di sini dibatasi */}
        <TrackList tracks={playlist.tracks} limit={limit} />
        {rest > 0 ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/playlist" className={buttonClass("secondary", "md")}>
              Lihat semua lagunya
            </Link>
            <p className="font-ui text-sm text-muted">
              Ini baru {limit} dari {playlist.tracks.length} lagu.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

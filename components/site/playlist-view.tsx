import Image from "next/image";
import Link from "next/link";
import { PlayAllButton, TrackList } from "@/components/player/track-list";
import { buttonClass } from "@/components/ui/button";
import { CHART_SIZE, chartWeekLabel, isoWeek } from "@/lib/chart";

const monthYear = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
import { cn } from "@/lib/cn";
import type { Chart, Playlist } from "@/lib/playlist";

/**
 * Sampul playlist, dirangkai dari sampul lagu-lagunya: empat kotak kalau lagunya cukup,
 * satu gambar kalau belum. Semuanya sudah monokrom dari server.
 */
export function PlaylistCover({
  artworks,
  className,
  rounded = "rounded-2xl lg:rounded-3xl",
  sizes = "(min-width: 1024px) 220px, 120px",
}: {
  artworks: string[];
  className?: string;
  /** Kelas sudutnya, dipisah supaya bisa diganti tanpa bentrok (cn tidak menggabungkan kelas Tailwind). */
  rounded?: string;
  sizes?: string;
}) {
  const tiles = artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid aspect-square shrink-0 overflow-hidden bg-(--cover)",
        rounded,
        tiles.length === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1",
        className,
      )}
    >
      {tiles.map((src) => (
        <span key={src} className="relative">
          <Image src={src} alt="" fill sizes={sizes} unoptimized className="mono-img object-cover" />
        </span>
      ))}
    </div>
  );
}

/**
 * Lencana tanggal chart: pil berisi rentang minggunya, dan nomor minggunya di sebelah.
 * Judul chart sudah menyebut "chart minggu ini", jadi lencananya menunjukkan minggu yang mana.
 */
export function ChartBadge({ chart, onDark = false, className }: { chart: Chart; onDark?: boolean; className?: string }) {
  const week = chartWeekLabel(chart.chartFrom, chart.chartTo);
  const number = isoWeek(chart.chartFrom);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}>
      <span
        className={cn(
          "inline-flex h-[26px] items-center whitespace-nowrap rounded-full border px-2.5 font-ui text-[12px] font-semibold uppercase tracking-[0.06em]",
          onDark ? "border-white text-white" : "border-ink text-ink",
        )}
      >
        {week || "Minggu ini"}
      </span>
      {number ? <span className={cn("font-ui text-[13px] font-medium", onDark ? "text-[#cfcfcf]" : "text-muted")}>minggu ke-{number}</span> : null}
    </div>
  );
}

/**
 * Satu playlist atau chart utuh: sampul, nama, keterangan, lalu daftar lagunya.
 * Dipakai di bagian Playlist beranda (chart dengan `limit`), di /chart (chart penuh), dan di /playlist/[slug].
 * Untuk chart, daftarnya menampilkan gerak dari minggu lalu dan lama bertahan.
 */
export function PlaylistShowcase({
  playlist,
  limit,
  titleAs: Title = "h3",
}: {
  playlist: Playlist | Chart;
  /** Jumlah lagu yang ditampilkan; sisanya lewat tautan ke halaman playlistnya. */
  limit?: number;
  titleAs?: "h2" | "h3";
}) {
  const rest = limit ? Math.max(playlist.tracks.length - limit, 0) : 0;
  const isChart = playlist.kind === "chart";
  const fullHref = isChart ? "/chart" : `/playlist/${playlist.slug}`;

  // grid-cols-1 wajib: tanpa itu kolom di HP melebar mengikuti catatan lagu yang sebaris, dan halaman jadi meluber
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
      {/* kolom kiri diam di tempatnya, tidak menempel ikut gulir (permintaan penulis, 11 Oktober 2026) */}
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6 lg:self-start">
        {/* satu blok selebar kolom kiri: sampul memenuhi kolom, lalu lencana, judul, keterangan, tombol, semuanya rata lebarnya */}
        <PlaylistCover artworks={playlist.artworks} className="w-full" sizes="(min-width: 1024px) 480px, 100vw" />
        <div className="flex min-w-0 flex-col gap-2.5">
          {playlist.kind === "chart" ? (
            <ChartBadge chart={playlist} />
          ) : (
            // lencana playlist mengikuti bentuk lencana tanggal chart: pil jumlah lagu, lalu kapan disusun
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex h-[26px] items-center whitespace-nowrap rounded-full border border-ink px-2.5 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-ink">
                {playlist.tracks.length} lagu
              </span>
              <span className="font-ui text-[13px] font-medium text-muted">disusun {monthYear.format(new Date(playlist.createdAt))}</span>
            </div>
          )}
          <Title className={cn("font-display font-medium leading-tight", isChart ? "text-[2rem] sm:text-[2.25rem] lg:text-[2.5rem] lg:leading-[1.1]" : "text-[1.75rem] sm:text-4xl")}>
            {playlist.name}
          </Title>
          {playlist.description ? <p className="text-[17px] leading-relaxed text-muted">{playlist.description}</p> : null}
        </div>
        {/* halaman satu playlist atau chart penuh: tombol putar ikut kolom kiri; di beranda tombolnya di bawah daftar */}
        {!limit ? (
          // selebar sampul di atasnya: penuh di HP, dibatasi lebar sampul di layar lebar
          <PlayAllButton tracks={playlist.tracks} queueId={playlist.id} block />
        ) : null}
        {playlist.story ? <StoryCard story={playlist.story} /> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        {/* antrean pemutar selalu seluruh playlist, walau yang tampil di sini dibatasi */}
        <TrackList
          tracks={playlist.tracks}
          queueId={playlist.id}
          limit={limit}
          chart={isChart}
          footer={limit && rest > 0 ? `Ini baru ${limit} dari ${isChart ? CHART_SIZE : playlist.tracks.length} lagu.` : undefined}
        />
        {limit ? (
          // dua tombol sejajar yang bersama-sama selebar daftar di atasnya, di semua ukuran layar
          <div className={cn("grid gap-3 sm:gap-4", rest > 0 ? "grid-cols-2" : "grid-cols-1")}>
            <PlayAllButton tracks={playlist.tracks} queueId={playlist.id} block />
            {rest > 0 ? (
              <Link href={fullHref} className={buttonClass("secondary", "md", undefined, true)}>
                Lihat semua lagunya
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Kartu "Cerita di balik playlist ini": tautan ke tulisan yang dikaitkan dari admin. */
function StoryCard({ story }: { story: { title: string; slug: string } }) {
  return (
    <Link href={`/tulisan/${story.slug}`} className="flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-ink">
      <span className="font-ui text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Cerita di balik playlist ini</span>
      <span className="font-display text-xl font-medium leading-snug">{story.title}</span>
    </Link>
  );
}

/**
 * Satu playlist di kisi halaman /playlist, gaya yang sama dengan kartu di beranda: mosaik sampul memenuhi kartu,
 * bayangan gelap di bawah, lalu nama, jumlah lagu, dan keterangannya. Playlist yang punya tulisan terkait diberi penanda kecil di pojok.
 */
export function PlaylistCard({ playlist, titleAs: Title = "h3" }: { playlist: Playlist; titleAs?: "h2" | "h3" }) {
  return (
    <Link href={`/playlist/${playlist.slug}`} className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl bg-(--cover) text-white sm:rounded-3xl">
      <PlaylistCover artworks={playlist.artworks} className="absolute inset-0 w-full transition-transform duration-500 group-hover:scale-[1.03]" rounded="rounded-none" sizes="(min-width: 1024px) 440px, 50vw" />
      <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.9)_0%,rgba(17,17,17,0.5)_45%,rgba(17,17,17,0.05)_75%)]" />
      {playlist.story ? (
        <span className="absolute left-3.5 top-3.5 inline-flex h-6 items-center rounded-full bg-white/90 px-2 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#111111] sm:left-4 sm:top-4">
          Ada ceritanya
        </span>
      ) : null}
      <span className="relative flex min-w-0 flex-col gap-1 p-3.5 sm:p-5">
        <span className="font-ui text-[12px] font-medium text-[#cfcfcf] sm:text-[13px]">{playlist.trackCount} lagu</span>
        <Title className="line-clamp-2 font-display text-[18px] font-medium leading-[1.2] sm:text-[1.625rem]">{playlist.name}</Title>
        {playlist.description ? <span className="line-clamp-2 hidden text-[15px] leading-snug text-[#dcdcdc] sm:block">{playlist.description}</span> : null}
      </span>
    </Link>
  );
}

/**
 * Strip playlist di bawah chart di beranda: kisi kartu bersampul penuh (gaya 3 mockup), dua kolom di HP dan empat
 * di layar lebar. Kotak terakhir kisi adalah tautan ke semua playlist (gaya 3 dari opsi tombol), jadi letak dan
 * bentuknya sama persis di laptop dan HP, tanpa tombol terpisah.
 */
export function OtherPlaylists({ playlists, max = 3 }: { playlists: Playlist[]; max?: number }) {
  const shown = playlists.slice(0, max);
  if (shown.length === 0) return null;
  const rest = playlists.length - shown.length;
  return (
    <div className="flex flex-col gap-6 border-t border-line pt-8 md:pt-10">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-[1.75rem] font-medium leading-tight sm:text-[2rem]">Playlist lainnya.</h3>
        <p className="max-w-[680px] text-[17px] leading-relaxed text-muted">
          Beda sama chart, playlist ini disusun pelan-pelan buat suasana tertentu dan nggak ganti tiap minggu. Tiap lagu tetap ada ceritanya.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {shown.map((playlist) => (
          <li key={playlist.id}>
            {/* mosaik jadi latar, nama dan jumlah lagu di atas bayangan gelap di bagian bawah */}
            <Link href={`/playlist/${playlist.slug}`} className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl bg-(--cover) text-white">
              <PlaylistCover artworks={playlist.artworks} className="absolute inset-0 w-full transition-transform duration-500 group-hover:scale-[1.03]" rounded="rounded-none" sizes="(min-width: 1024px) 300px, 50vw" />
              <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.85)_0%,rgba(17,17,17,0.35)_45%,rgba(17,17,17,0)_70%)]" />
              <span className="relative flex min-w-0 flex-col gap-0.5 p-3.5 sm:p-4">
                <span className="line-clamp-2 font-display text-[17px] font-medium leading-[1.2] sm:text-[20px]">{playlist.name}</span>
                <span className="font-ui text-[13px] text-[#cfcfcf]">{playlist.trackCount} lagu</span>
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/playlist"
            className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border-strong p-4 text-center transition-colors hover:border-ink"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-ink text-bg">
              <ArrowIcon />
            </span>
            <span className="font-display text-[17px] font-medium leading-[1.2] sm:text-[20px]">Semua playlist</span>
            <span className="font-ui text-[13px] text-muted">{rest > 0 ? `${rest} playlist lagi` : `${playlists.length} playlist`}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

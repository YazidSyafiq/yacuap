import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChartBadge, PlaylistCard, PlaylistCover } from "@/components/site/playlist-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { CHART_SIZE } from "@/lib/chart";
import { getChart, getPlaylists } from "@/lib/playlist";

export const metadata: Metadata = {
  title: "Playlist",
  description: "Chart mingguan paling atas, sisanya playlist buat suasana tertentu. Tiap lagu ada ceritanya.",
};

export const revalidate = 300;

/** Semua playlist: chart minggu ini sebagai kartu besar paling atas, lalu kisi playlist lainnya. */
export default async function PlaylistsPage() {
  // chart bukan playlist: tampil sebagai kartu di atas, tidak ikut dihitung
  const [chart, others] = await Promise.all([getChart(), getPlaylists()]);
  const trackTotal = others.reduce((sum, playlist) => sum + playlist.trackCount, 0);

  return (
    <Container className="flex flex-col gap-10 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Eyebrow>Playlist</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          Lagu-lagu yang disusun pelan-pelan.
        </h1>
        <p className="max-w-[680px] text-xl leading-relaxed text-muted">
          Paling atas chart minggu ini, yang berganti tiap minggu. Di bawahnya playlist buat suasana tertentu, yang nggak ganti-ganti dan tiap lagunya ada ceritanya.
        </p>
      </header>

      {chart ? (
        // kartu chart: mosaik sampul jadi latar dengan bayangan gelap, seperti kartu playlist di beranda, versi melebar
        <Link href="/chart" className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl bg-[#111111] text-white sm:min-h-[360px]">
          <PlaylistCover artworks={chart.artworks} className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.02]" rounded="rounded-none" sizes="100vw" />
          <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.92)_0%,rgba(17,17,17,0.72)_45%,rgba(17,17,17,0.35)_100%)]" />
          <span className="relative flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <span className="flex min-w-0 flex-col gap-3">
              <ChartBadge chart={chart} onDark />
              <span className="font-display text-[2rem] font-medium leading-tight sm:text-[2.75rem]">{chart.name}</span>
              {chart.description ? <span className="max-w-[560px] text-[16px] leading-relaxed text-[#cfcfcf] sm:text-[17px]">{chart.description}</span> : null}
              {/* lima teratas sebagai deretan sampul kecil bernomor */}
              <span className="mt-1 flex items-center gap-2">
                {chart.tracks.slice(0, 5).map((track, i) => (
                  <span key={track.id} className="relative size-10 overflow-hidden rounded-lg bg-(--cover) sm:size-12">
                    {track.artwork ? <Image src={track.artwork} alt="" fill sizes="48px" unoptimized className="mono-img object-cover" /> : null}
                    <span className="absolute bottom-0 left-0 rounded-tr-md bg-[#111111] px-1 font-ui text-[10px] font-semibold text-white">{i + 1}</span>
                  </span>
                ))}
                <span className="ml-1 font-ui text-[13px] text-[#cfcfcf]">
                  {chart.trackCount} dari {CHART_SIZE} lagu
                </span>
              </span>
            </span>
            <span className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-white px-3 font-ui text-sm font-semibold text-[#111111] lg:w-[236px]">
              Buka chart-nya
            </span>
          </span>
        </Link>
      ) : null}

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-[1.75rem] font-medium leading-tight sm:text-[2rem]">{chart ? "Playlist lainnya." : "Playlist."}</h2>
            <p className="max-w-[680px] text-[17px] leading-relaxed text-muted">Disusun pelan-pelan buat suasana tertentu, nggak ganti tiap minggu. Yang punya penanda, ada tulisannya.</p>
          </div>
          {others.length > 0 ? (
            <p className="font-ui text-sm text-muted">
              {others.length} playlist, {trackTotal} lagu
            </p>
          ) : null}
        </div>
        {others.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {others.map((playlist) => (
              <li key={playlist.id}>
                <PlaylistCard playlist={playlist} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-2 py-4">
            <p className="font-display text-2xl italic">{chart ? "Baru chart-nya aja, nih." : "Belum ada lagunya, nih."}</p>
            <p className="text-[17px] text-muted">
              {chart ? "Playlist lain lagi disusun. Nanti nongol di sini." : "Lagunya lagi dipilih-pilih dulu. Nanti tinggal pencet, langsung bunyi."}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}

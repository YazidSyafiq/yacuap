import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaylistShowcase } from "@/components/site/playlist-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { getPlaylistBySlug, getPlaylists } from "@/lib/playlist";

export const revalidate = 300;

// playlist yang sudah ada dibuat saat build; yang baru terbit dibuat saat pertama dibuka
export async function generateStaticParams() {
  const playlists = await getPlaylists();
  return playlists.map((playlist) => ({ slug: playlist.slug }));
}

export async function generateMetadata({ params }: PageProps<"/playlist/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) return {};
  return {
    title: playlist.name,
    description: playlist.description || `${playlist.trackCount} lagu, tiap lagu ada ceritanya.`,
  };
}

/** Satu playlist utuh, susunannya sama dengan halaman chart: kepala halaman umum, lalu nama dan keterangan playlist di kolom kiri bersama daftar lagunya. */
export default async function PlaylistPage({ params }: PageProps<"/playlist/[slug]">) {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) notFound();

  return (
    <Container className="flex flex-col gap-10 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Link href="/playlist" className="inline-flex items-center gap-1.5 self-start font-ui text-[13px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Semua playlist
        </Link>
        <Eyebrow>Playlist</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          Buat suasana tertentu.
        </h1>
        <p className="max-w-[680px] text-xl leading-relaxed text-muted">
          Playlist yang disusun pelan-pelan dan nggak ganti tiap minggu. Tiap lagu ada ceritanya, pencet aja, langsung bunyi.
        </p>
      </header>

      <PlaylistShowcase playlist={playlist} titleAs="h2" />
    </Container>
  );
}

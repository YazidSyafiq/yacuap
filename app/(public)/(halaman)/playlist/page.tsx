import type { Metadata } from "next";
import { PlaylistShowcase } from "@/components/site/playlist-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { getPlaylist } from "@/lib/playlist";

export const metadata: Metadata = {
  title: "Playlist",
  description: "Tiap lagu ada ceritanya, kenapa bisa sampai masuk sini.",
};

export const revalidate = 300;

/** Daftar lagu lengkap. Playlistnya cuma satu; beranda menampilkan beberapa lagu pertamanya saja. */
export default async function PlaylistPage() {
  const playlist = await getPlaylist();

  return (
    <Container className="flex flex-col gap-10 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Eyebrow>Playlist</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          Lagi sering muter ini.
        </h1>
        <p className="max-w-[680px] text-xl leading-relaxed text-muted">
          Tiap lagu ada ceritanya, kenapa bisa sampai masuk sini. Pencet aja, langsung bunyi.
        </p>
      </header>

      {playlist ? (
        <PlaylistShowcase playlist={playlist} titleAs="h2" />
      ) : (
        <div className="flex flex-col gap-2 py-4">
          <p className="font-display text-2xl italic">Belum ada lagunya, nih.</p>
          <p className="text-[17px] text-muted">Lagunya lagi dipilih-pilih dulu. Nanti tinggal pencet, langsung bunyi.</p>
        </div>
      )}
    </Container>
  );
}

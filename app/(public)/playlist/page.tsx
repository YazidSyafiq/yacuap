import type { Metadata } from "next";
import { Container, Eyebrow } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Playlist",
  description: "Lagu-lagu yang lagi sering diputer, plus alasan kenapa masuk.",
};

export default function PlaylistIndexPage() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-4 border-b-2 border-ink pb-8">
        <Eyebrow>Playlist</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-medium leading-tight sm:text-5xl">Lagi sering diputer</h1>
        <p className="max-w-[640px] text-xl text-muted">
          Kumpulan lagu, tiap lagu ada catatan kecil kenapa dia masuk. Dengerin aja dulu.
        </p>
      </header>
      <p className="font-display text-2xl italic">Belum ada playlist, nih. Lagi dipilih-pilih dulu.</p>
    </Container>
  );
}

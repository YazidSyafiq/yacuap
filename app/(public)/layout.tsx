import { PlayerBar } from "@/components/player/player-bar";
import { SiteHeader } from "@/components/site/header";

/**
 * Kerangka semua halaman publik: header di atas, bar pemutar musik di bawah.
 * Footer hanya ada di beranda, lihat (beranda)/layout.tsx.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      {/* bar pemutar ada di layout ini supaya lagu tidak putus saat pindah halaman */}
      <PlayerBar />
    </>
  );
}

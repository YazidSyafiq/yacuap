import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { CrowdCanvas, type CrowdHost } from "@/components/ui/crowd-canvas";

/** "Saya" di tengah kerumunan: sosok pertama di sprite (lihat HOST di scripts/buat-sprite-kerumunan.cjs). */
const TUAN_RUMAH: CrowdHost = {
  index: 0,
  bubbleImage: "/logo/yacuap-mark-putih.png",
  bubbleImageDark: "/logo/yacuap-mark.png",
  position: 0.5,
};

/**
 * Hero beranda. Selalu setinggi layar dikurangi header, di perangkat apa pun:
 * teks di tengah atas (dipadatkan di layar pendek seperti HP mendatar), kerumunan mengisi sisa tinggi,
 * "saya" berdiri di tengah kerumunan.
 *
 * Balon di atas kerumunan berisi celotehan: tulisan sebaris dari penulis.
 * Copy sengaja santai, tanpa nama, dan tidak membatasi isi situs ke topik tertentu.
 */
export function Hero({ celotehan }: { celotehan: readonly string[] }) {
  return (
    <section className="relative flex min-h-[calc(100vh-var(--header-h))] flex-col overflow-hidden border-b border-line supports-[height:100svh]:min-h-[calc(100svh-var(--header-h))]">
      <Container className="relative z-10 flex flex-col items-center gap-4 pt-8 text-center sm:pt-10 [@media(max-height:520px)]:gap-2 [@media(max-height:520px)]:pt-4">
        <Eyebrow className="[@media(max-height:520px)]:hidden">Hai, selamat mampir</Eyebrow>
        <h1 className="font-display text-[2.75rem] font-normal leading-[1.04] tracking-[-0.015em] text-balance sm:text-[4rem] [@media(max-height:520px)]:text-[1.625rem]">
          Sini, saya mau cerita.
        </h1>
        <p className="max-w-[34ch] text-lg leading-snug text-muted text-balance sm:max-w-[52ch] sm:text-xl [@media(max-height:520px)]:max-w-none [@media(max-height:520px)]:text-[15px]">
          Apa aja yang lewat di kepala, ditulis di sini. Kadang panjang, kadang cuma sebaris, kadang nggak jelas
          juga.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 [@media(max-height:520px)]:hidden">
          <Link href="#tulisan" className={buttonClass("primary")}>
            Baru kelar nulis, baca dong
          </Link>
          <Link href="#playlist" className={buttonClass("secondary")}>
            Lagi sering muter ini, nih
          </Link>
        </div>
      </Container>
      {/* jarak di atas kerumunan supaya balon tidak menempel ke tombol */}
      <div className="relative mt-6 min-h-[260px] flex-1 sm:mt-8 sm:min-h-[300px] lg:min-h-[360px] 2xl:min-h-[440px] [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:min-h-[150px]">
        <div className="absolute inset-0">
          <CrowdCanvas
            src="/hero/kerumunan.png"
            srcDark="/hero/kerumunan-gelap.png"
            phrases={celotehan}
            host={TUAN_RUMAH}
          />
        </div>
      </div>
    </section>
  );
}

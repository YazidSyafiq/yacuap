import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

const navLink = "py-2 text-ink hover:text-muted";

/**
 * Menu utama menggulir ke bagian-bagian di beranda, bukan membuka halaman lain.
 * Alamatnya diawali "/" supaya tetap jalan dari halaman mana pun.
 * Hanya tampil di layar lebar; di HP header cuma berisi logo dan tombol tema.
 */
const MENU = [
  { href: "/#tulisan", label: "Tulisan" },
  { href: "/#ocehan", label: "Ocehan" },
  { href: "/#playlist", label: "Playlist" },
  { href: "/#oknumnya", label: "Oknumnya" },
];

/**
 * Menempel di atas layar saat menggulir, karena menunya menggulir ke bagian-bagian beranda.
 * Tinggi header tetap (var(--header-h)) dan selalu satu baris,
 * supaya hero bisa dihitung pas setinggi sisa layar.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-(--header-h) border-b border-line bg-bg/90 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-3 sm:gap-4">
        <Link href="/" aria-label={`${site.name}, ke beranda`} className="flex shrink-0 items-center gap-2.5">
          {/*
            Logo kotak dengan proporsi yang sama seperti balon tuan rumah di kerumunan:
            jarak simbol ke tepi 32% tinggi simbol di keempat sisi, sudut 30% tinggi kotak.
            Kotaknya bertinta (hitam di mode terang, terang di mode gelap), simbolnya kebalikannya.
          */}
          <span className="flex h-11 w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-ink sm:h-[52px] sm:w-[55px] sm:rounded-[16px]">
            <Image
              src="/logo/yacuap-mark-putih.png"
              alt=""
              width={35}
              height={32}
              priority
              className="theme-invert h-[27px] w-auto sm:h-8"
            />
          </span>
          {/* nama + keterangan di bawahnya, tampil sama di HP dan di layar lebar */}
          <span className="flex flex-col">
            <Image
              src="/logo/yacuap-wordmark.png"
              alt={site.name}
              width={83}
              height={28}
              priority
              className="theme-invert h-7 w-auto"
            />
            <span className="-mt-0.5 pl-[3px] font-display text-[13px] italic text-muted">
              Yazid cuap-cuap
            </span>
          </span>
        </Link>
        {/*
          Fraunces, sama dengan judul hero, supaya header dan hero terasa satu kesatuan.
          Di HP menunya tidak ditampilkan: yang ada hanya logo dan tombol tema.
        */}
        <nav aria-label="Utama" className="flex items-center gap-7 font-display text-lg">
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} className={`hidden sm:inline ${navLink}`}>
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </Container>
    </header>
  );
}

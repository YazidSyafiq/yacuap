import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

/** Lockup horizontal (simbol + wordmark). Rasio aset 1132 x 382. */
export function Logo({ height = 36, href = "/" }: { height?: number; href?: string | null }) {
  const img = (
    <Image
      src="/logo/yacuap-lockup-horizontal.png"
      alt={site.name}
      width={Math.round((height * 1132) / 382)}
      height={height}
      priority
      className="theme-invert"
    />
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label={`${site.name}, ke beranda`} className="inline-flex items-center">
      {img}
    </Link>
  );
}

/** Versi putih untuk latar bertinta (sidebar admin). Ikut dibalik di mode gelap, karena di sana tinta jadi terang. */
export function LogoOnDark({ height = 30 }: { height?: number }) {
  const wordHeight = Math.round(height * 0.62);
  return (
    <Link href="/" aria-label={`${site.name}, ke beranda`} className="theme-invert inline-flex items-center gap-1.5">
      <Image src="/logo/yacuap-mark-putih.png" alt="" width={Math.round((height * 622) / 569)} height={height} />
      <Image
        src="/logo/yacuap-wordmark-putih.png"
        alt={site.name}
        width={Math.round((wordHeight * 670) / 225)}
        height={wordHeight}
      />
    </Link>
  );
}

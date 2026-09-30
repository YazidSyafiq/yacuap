import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Foto penulis, satu-satunya yang dipakai di seluruh situs dan admin:
 * gambar dari bagian Oknumnya, utuh di dalam kotak bersudut bulat yang bentuk dan proporsinya
 * sama dengan kotak logo di header (sudut 30% dari tinggi kotak).
 * Kotaknya kebalikan tema: hitam di mode terang, abu terang di mode gelap.
 * Gambarnya dibuat oleh scripts/buat-avatar-oknum.cjs.
 */
export function AuthorPhoto({ size = 56, className }: { size?: number; className?: string }) {
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.3) };
  return (
    <>
      <Image
        src="/oknum/penulis-kotak-hitam.png"
        alt=""
        width={size}
        height={size}
        unoptimized
        style={style}
        className={cn("shrink-0 dark:hidden", className)}
      />
      <Image
        src="/oknum/penulis-kotak-abu.png"
        alt=""
        width={size}
        height={size}
        unoptimized
        style={style}
        className={cn("hidden shrink-0 dark:block", className)}
      />
    </>
  );
}

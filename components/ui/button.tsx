import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/**
 * ATURAN UKURAN TOMBOL: panjang dan lebar tombol selalu seragam.
 *
 * - `md` (bawaan, tombol utama halaman): 236 x 44 px.
 * - `sm` (tombol kecil di dalam kartu atau baris data): 160 x 40 px.
 * - `block` (tombol di dalam formulir): selebar formulirnya, tinggi tetap mengikuti ukurannya.
 * - `block="sm"`: selebar wadahnya hanya di layar sempit (HP), ukuran tetap mulai layar sm. Untuk tombol di
 *   kepala halaman dan kaki pop up, supaya di HP tidak menggantung di kiri dengan lebar setengah layar.
 *
 * Lebar TIDAK mengikuti panjang tulisan. Jadi tombol-tombol yang berdampingan selalu sama besar,
 * dan tulisan tombol harus muat: paling panjang sekitar 28 karakter untuk `md`, 17 untuk `sm`.
 * Jangan menimpa lebar atau tinggi lewat `className`; kalau butuh ukuran lain, tambahkan di sini
 * supaya tetap seragam di seluruh situs.
 */
const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-ui font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-ink text-surface hover:bg-ink-soft",
  secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-surface",
  ghost: "bg-transparent text-muted hover:text-ink",
  // hanya untuk tindakan yang tidak bisa dibatalkan (hapus), satu-satunya tombol berwarna
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes: Record<Size, string> = {
  md: "h-11 w-[236px] max-w-full px-3 text-sm",
  sm: "h-10 w-40 max-w-full px-3 text-[13px]",
};
const blockSizes: Record<Size, string> = {
  md: "h-11 w-full px-4 text-sm",
  sm: "h-10 w-full px-3 text-[13px]",
};
const mobileBlockSizes: Record<Size, string> = {
  md: "h-11 w-full px-4 text-sm sm:w-[236px] sm:max-w-full sm:px-3",
  sm: "h-10 w-full px-3 text-[13px] sm:w-40 sm:max-w-full",
};

type Block = boolean | "sm";
type Options = { variant?: Variant; size?: Size; block?: Block };

/** Kelas tombol untuk elemen selain <button>, misalnya <Link>. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string, block: Block = false) {
  const sizeClass = block === "sm" ? mobileBlockSizes[size] : block ? blockSizes[size] : sizes[size];
  return cn(base, variants[variant], sizeClass, className);
}

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Options) {
  return <button type={type} className={buttonClass(variant, size, className, block)} {...props} />;
}

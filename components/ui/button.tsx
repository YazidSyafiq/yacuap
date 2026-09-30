import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "sm";

/**
 * ATURAN UKURAN TOMBOL: panjang dan lebar tombol selalu seragam.
 *
 * - `md` (bawaan, tombol utama halaman): 236 x 44 px.
 * - `sm` (tombol kecil di dalam kartu atau baris data): 160 x 40 px.
 * - `block` (tombol di dalam formulir): selebar formulirnya, tinggi tetap mengikuti ukurannya.
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
};
const sizes: Record<Size, string> = {
  md: "h-11 w-[236px] max-w-full px-3 text-sm",
  sm: "h-10 w-40 max-w-full px-3 text-[13px]",
};
const blockSizes: Record<Size, string> = {
  md: "h-11 w-full px-4 text-sm",
  sm: "h-10 w-full px-3 text-[13px]",
};

type Options = { variant?: Variant; size?: Size; block?: boolean };

/** Kelas tombol untuk elemen selain <button>, misalnya <Link>. */
export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string, block = false) {
  return cn(base, variants[variant], block ? blockSizes[size] : sizes[size], className);
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

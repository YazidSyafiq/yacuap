/** Halaman selain beranda (daftar lagu, rak tulisan, dan seterusnya): tanpa footer, isinya saja. */
export default function HalamanLayout({ children }: LayoutProps<"/">) {
  return <main className="flex-1 pb-10 md:pb-14">{children}</main>;
}

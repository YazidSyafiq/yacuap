"use client";

import { cn } from "@/lib/cn";

/**
 * Tombol ganti mode terang dan gelap.
 * Sumber kebenarannya atribut data-theme di <html> (dipasang skrip di app/layout.tsx sebelum halaman digambar).
 * Ikon diatur lewat CSS berdasarkan atribut itu, jadi tidak ada state React dan tidak ada selisih hidrasi.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // penyimpanan diblokir: tema tetap berganti untuk kunjungan ini
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti mode terang atau gelap"
      title="Ganti mode terang atau gelap"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
        // warna bawaan hanya dipakai kalau pemanggil tidak memberi warna sendiri
        className ?? "text-ink hover:text-muted",
      )}
    >
      {/* bulan: tampil di mode terang, artinya "pindah ke gelap" */}
      <svg
        viewBox="0 0 24 24"
        className="size-[18px] dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      {/* matahari: tampil di mode gelap, artinya "pindah ke terang" */}
      <svg
        viewBox="0 0 24 24"
        className="hidden size-[18px] dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}

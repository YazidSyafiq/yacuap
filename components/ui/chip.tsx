import { cn } from "@/lib/cn";

/**
 * Tag dibedakan lewat gelap-terang, bukan warna: gelap, abu, lalu bergaris, berulang sesuai urutan tag.
 * Jadi tag yang baru ditambahkan dari admin otomatis dapat gaya tanpa perlu diatur.
 */
const TONES = [
  "bg-ink text-surface border-ink",
  "bg-line text-ink border-line",
  "bg-surface text-ink border-ink",
];

export function TagChip({ tag, className }: { tag: { name: string; position: number }; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em]",
        TONES[Math.abs(tag.position) % TONES.length],
        className,
      )}
    >
      {tag.name}
    </span>
  );
}

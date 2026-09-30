import { categories, type Category } from "@/lib/categories";
import { cn } from "@/lib/cn";

/** Kategori dibedakan lewat gelap-terang, bukan warna. */
const tone: Record<Category, string> = {
  musik: "bg-ink text-surface border-ink",
  pikiran: "bg-line text-ink border-line",
  absurd: "bg-surface text-ink border-ink",
};

export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-ui text-[11px] font-semibold uppercase tracking-[0.08em]",
        tone[category],
        className,
      )}
    >
      {categories[category].label}
    </span>
  );
}

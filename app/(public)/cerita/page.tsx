import type { Metadata } from "next";
import Link from "next/link";
import { CategoryChip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { categories, CATEGORY_SLUGS } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Cerita",
  description: "Yang panjang-panjang ada di sini. Soal apa aja.",
};

/** Semua cerita jadi satu. Musik, Pikiran, dan Absurd tetap ada sebagai rak, bukan menu utama. */
export default function StoriesPage() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-4 border-b-2 border-ink pb-8">
        <h1 className="font-display text-[2.5rem] font-medium leading-tight sm:text-5xl">Cerita</h1>
        <p className="max-w-[640px] text-xl text-muted">
          Yang panjang-panjang ada di sini. Soal apa aja, tergantung lagi kepikiran apa.
        </p>
        <nav aria-label="Rak cerita" className="flex flex-wrap items-center gap-2 pt-1">
          <span className="pr-1 font-ui text-[13px] text-muted">Mau yang mana?</span>
          {CATEGORY_SLUGS.map((slug) => (
            <Link key={slug} href={`/${slug}`} aria-label={`Cerita ${categories[slug].label}`}>
              <CategoryChip category={slug} className="px-4 py-2 text-xs" />
            </Link>
          ))}
        </nav>
      </header>
      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl italic">Belum ada cerita, nih.</p>
        <p className="text-[17px] text-muted">Lagi ditulis, sabar ya. Yang pertama bakal nongol di sini.</p>
      </div>
    </Container>
  );
}

import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { Oknum } from "@/components/site/oknum";
import { CategoryChip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { categories, CATEGORY_SLUGS } from "@/lib/categories";
import { getCelotehan } from "@/lib/celotehan";

// Beranda statis, disegarkan berkala. Saat admin sudah ada, penyegaran dipicu langsung saat menerbitkan.
export const revalidate = 300;

/** Judul bagian + tautan "lihat semua" di kanannya. */
function SectionHeading({ title, note, href, more }: { title: string; note: string; href?: string; more?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-ink pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[2rem] font-medium leading-tight sm:text-[2.5rem]">{title}</h2>
        <p className="text-lg text-muted">{note}</p>
      </div>
      {href && more ? (
        <Link href={href} className="pb-1 font-ui text-sm font-medium text-muted hover:text-ink">
          {more}
        </Link>
      ) : null}
    </div>
  );
}

/** Beranda satu halaman: menu di header menggulir ke bagian-bagian di bawah ini. */
export default async function HomePage() {
  const celotehan = await getCelotehan();

  return (
    <>
      <Hero celotehan={celotehan} />

      <section id="tulisan" className="section-anchor">
        <Container className="flex flex-col gap-6 py-12">
          <SectionHeading
            title="Tulisan"
            note="Yang panjang-panjang. Soal apa aja, tergantung lagi kepikiran apa."
            href="/cerita"
            more="Lihat semua, dong"
          />
          <nav aria-label="Rak tulisan" className="flex flex-wrap items-center gap-2">
            <span className="pr-1 font-ui text-[13px] text-muted">Mau yang mana?</span>
            {CATEGORY_SLUGS.map((slug) => (
              <Link key={slug} href={`/${slug}`} aria-label={`Tulisan ${categories[slug].label}`}>
                <CategoryChip category={slug} className="px-4 py-2 text-xs" />
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-2 py-4">
            <p className="font-display text-2xl italic">Belum ada tulisan, nih.</p>
            <p className="text-[17px] text-muted">Lagi ditulis, sabar ya. Yang pertama bakal nongol di sini.</p>
          </div>
        </Container>
      </section>

      <section id="ocehan" className="section-anchor border-t border-line">
        <Container className="flex flex-col gap-2 py-12">
          <SectionHeading
            title="Ocehan"
            note="Yang pendek-pendek. Sebaris, kadang nggak sampai."
            href="/celotehan"
            more="Lihat semua, dong"
          />
          <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
            {celotehan.slice(0, 9).map((text, index) => (
              <li
                key={`${index}-${text}`}
                className="border-b border-line py-5 font-display text-2xl italic leading-snug"
              >
                {text}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="playlist" className="section-anchor border-t border-line">
        <Container className="flex flex-col gap-6 py-12">
          <SectionHeading
            title="Playlist"
            note="Lagu-lagu yang lagi sering diputer, plus alasan kenapa masuk."
            href="/playlist"
            more="Lihat semua, dong"
          />
          <div className="flex flex-col gap-2 py-4">
            <p className="font-display text-2xl italic">Belum ada playlist, nih.</p>
            <p className="text-[17px] text-muted">Lagi dipilih-pilih dulu. Nanti bisa langsung diputer dari sini.</p>
          </div>
        </Container>
      </section>

      <Oknum />
    </>
  );
}

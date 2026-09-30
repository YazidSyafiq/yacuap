import Link from "next/link";
import type { ReactNode } from "react";
import { Hero } from "@/components/site/hero";
import { OcehanWave } from "@/components/site/ocehan-wave";
import { Oknum } from "@/components/site/oknum";
import { PlaylistShowcase } from "@/components/site/playlist-view";
import { CategoryChip } from "@/components/ui/chip";
import { Container, Eyebrow } from "@/components/ui/container";
import { categories, CATEGORY_SLUGS } from "@/lib/categories";
import { getCelotehan } from "@/lib/celotehan";
import { getPlaylist } from "@/lib/playlist";

// Beranda statis, disegarkan berkala. Saat admin sudah ada, penyegaran dipicu langsung saat menerbitkan.
export const revalidate = 300;

/**
 * Kepala bagian, seragam dengan bagian Oknumnya: penanda kecil berisi nama bagian,
 * lalu tulisan besar di bawahnya, lalu satu kalimat keterangan. Tautan "lihat semua" opsional di kanan.
 */
function SectionHeading({
  label,
  title,
  note,
  reply,
  href,
  more,
}: {
  label: string;
  title: string;
  note?: ReactNode;
  /** Celetukan yang muncul di sebelah keterangan, sebagai balon jawaban. */
  reply?: string;
  href?: string;
  more?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="flex flex-col gap-4">
        <Eyebrow>{label}</Eyebrow>
        {/* satu baris di layar lebar; di layar sempit boleh turun baris supaya tidak terpotong */}
        <h2 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem] lg:whitespace-nowrap">
          {title}
        </h2>
        {note ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="max-w-[680px] text-xl leading-relaxed text-muted">{note}</p>
            {reply ? (
              // celetukan jawaban: pil tanpa ekor, muncul, bertahan, hilang, lalu muncul lagi
              <span className="bubble-loop inline-block">
                <span className="inline-block -rotate-3 rounded-full bg-ink px-4 py-1.5 font-ui text-sm font-semibold text-bg sm:text-base">
                  {reply}
                </span>
              </span>
            ) : null}
          </div>
        ) : null}
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
  // semua ocehan untuk bagian Ocehan; balon di hero cukup memakai 40 yang terbaru
  const [celotehan, playlist] = await Promise.all([getCelotehan(500), getPlaylist()]);

  return (
    <>
      <Hero celotehan={celotehan.slice(0, 40)} />

      <section id="tulisan" className="section-anchor">
        <Container className="flex flex-col gap-8 py-14 md:py-20">
          <SectionHeading
            label="Tulisan"
            title="Baru kelar nulis, nih."
            note="Yang panjang-panjang ada di sini. Soal apa aja, tergantung lagi kepikiran apa."
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

      <section id="playlist" className="section-anchor border-t border-line">
        <Container className="flex flex-col gap-8 py-14 md:py-20">
          <SectionHeading
            label="Playlist"
            title="Lagi sering muter ini."
            note="Tiap lagu ada ceritanya, kenapa bisa sampai masuk sini."
          />
          {playlist ? (
            // di beranda cukup beberapa lagu pertama; daftar lengkapnya di /playlist
            <PlaylistShowcase playlist={playlist} limit={5} />
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-display text-2xl italic">Belum ada lagunya, nih.</p>
              <p className="text-[17px] text-muted">Lagunya lagi dipilih-pilih dulu. Nanti tinggal pencet, langsung bunyi.</p>
            </div>
          )}
        </Container>
      </section>

      {/* Semua ocehan tampil langsung di sini; tidak ada halaman ocehan tersendiri. */}
      <section id="ocehan" className="section-anchor overflow-hidden border-t border-line">
        <Container className="pt-14 md:pt-20">
          <SectionHeading
            label="Ocehan"
            title="Nggak penting, tapi kepikiran."
            note={
              <>
                Maaf kalo absurd, namanya juga <em className="font-display text-ink">spontan</em>.
              </>
            }
            reply="Uhuyyy"
          />
        </Container>
        {/* ocehan mengalir di jalur zigzag, selebar layar; diklik untuk membesar */}
        <div className="pb-14 pt-10 md:pb-20 md:pt-12">
          <OcehanWave phrases={celotehan} />
        </div>
      </section>

      <Oknum />
    </>
  );
}

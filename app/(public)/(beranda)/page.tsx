import Link from "next/link";
import type { ReactNode } from "react";
import { Hero } from "@/components/site/hero";
import { OcehanWave } from "@/components/site/ocehan-wave";
import { Oknum } from "@/components/site/oknum";
import { PlaylistShowcase } from "@/components/site/playlist-view";
import { PostCard, PostRow } from "@/components/site/post-cards";
import { buttonClass } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/container";
import { getCelotehan } from "@/lib/celotehan";
import { getPlaylist } from "@/lib/playlist";
import { getPosts } from "@/lib/posts";

// Beranda statis, disegarkan berkala. Saat admin sudah ada, penyegaran dipicu langsung saat menerbitkan.
export const revalidate = 300;

/** Jumlah tulisan di beranda: dua kartu di kiri, tiga baris di kanan. Sisanya di /tulisan. */
const HOME_POSTS = 5;

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
  const [celotehan, playlist, posts] = await Promise.all([getCelotehan(500), getPlaylist(), getPosts()]);
  const shown = posts.slice(0, HOME_POSTS);

  return (
    <>
      <Hero celotehan={celotehan.slice(0, 40)} />

      <section id="tulisan" className="section-anchor">
        <Container className="flex flex-col gap-8 py-14 md:py-20">
          <SectionHeading
            label="Tulisan"
            title="Yang ini ditulis beneran."
            note="Bukan sekedar ocehan absurd. Ini yang dipikirin dulu, baru ditulis."
          />
          {shown.length > 0 ? (
            <div className="flex flex-col gap-8">
              {/* dua tulisan terbaru jadi kartu di kiri, tiga berikutnya jadi daftar di kanan */}
              <div className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-10">
                  {shown.slice(0, 2).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                {shown.length > 2 ? (
                  // barisnya direntangkan supaya tinggi kolom kanan sama dengan kolom kiri
                  <div className="flex min-w-0 flex-col border-t border-line">
                    {shown.slice(2).map((post) => (
                      <PostRow key={post.id} post={post} titleAs="h3" className="lg:flex-1 lg:items-center" />
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="/tulisan" className={buttonClass("secondary", "md")}>
                  Lihat semua tulisannya
                </Link>
                {posts.length > HOME_POSTS ? (
                  <p className="font-ui text-sm text-muted">
                    Ini baru {HOME_POSTS} dari {posts.length} tulisan.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 py-4">
              <p className="font-display text-2xl italic">Belum ada tulisan, nih.</p>
              <p className="text-[17px] text-muted">Lagi ditulis, sabar ya. Yang pertama bakal nongol di sini.</p>
            </div>
          )}
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

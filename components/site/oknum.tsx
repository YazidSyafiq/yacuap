import Image from "next/image";
import { Container, Eyebrow } from "@/components/ui/container";

const ALT = "Gambar Yazid: senyum, berkumis dan berjanggut tipis, kaos hitam, mengacungkan jempol";

/**
 * Bagian "Oknumnya": tentang penulisnya, bukan tentang situsnya.
 * Di akhir ada sedikit alasan kenapa situs ini dibuat.
 *
 * Gambarnya ilustrasi penulis sendiri (sumber: docs/its me.png), dipotong dari latarnya oleh
 * scripts/potong-gambar-oknum.cjs jadi public/oknum/yazid.png dan versi gelapnya yang bergaris tepi terang.
 * Animasinya dua saja, yang biasa-biasa: gambar mengambang sangat pelan, dan balon sapaan di dekat jempol
 * muncul dan hilang berulang-ulang, seperti disapa terus. Teksnya diam.
 */
export function Oknum() {
  return (
    <section id="oknumnya" className="section-anchor border-t border-line">
      <Container className="grid items-center gap-x-14 gap-y-10 py-14 md:grid-cols-[minmax(0,1fr)_auto] md:py-20">
        <div className="flex max-w-[680px] flex-col gap-6">
          <Eyebrow>Oknumnya</Eyebrow>
          <h2 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
            Halo, saya Yazid.
          </h2>
          <div className="flex flex-col gap-4 text-xl leading-relaxed">
            <p>
              Orang biasa yang kepalanya jarang diem. Suka dengerin lagu sampai diulang-ulang, suka kepikiran hal yang
              nggak penting, dan suka lupa kalau nggak buru-buru ditulis.
            </p>
            <p>
              {/* letak gambar beda: di HP ada di bawah teks, di layar lebar ada di sebelahnya */}
              Yang ngacungin jempol <span className="md:hidden">di bawah</span>
              <span className="hidden md:inline">di sebelah</span> itu saya, versi gambar. Aslinya ya kurang lebih
              begitu.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-6">
            <h3 className="font-display text-2xl font-medium">Terus, kenapa bikin ini?</h3>
            <p className="text-lg leading-relaxed text-muted">
              Soalnya pengen punya tempat sendiri buat nuangin apa aja dalam tulisan. Mau cerita panjang, mau ngelantur
              soal hal absurd, mau pamer lagu yang lagi sering diputar, semuanya bisa di sini. Nggak ada tema khusus,
              nggak ada jadwal. Kalau lagi pengen nulis, ya ditulis.
            </p>
            <p className="font-display text-xl italic">Boleh didengerin, boleh dicuekin.</p>
          </div>
        </div>

        {/* gambar di tengah tinggi bagian, tidak menempel ke footer */}
        <div className="flex justify-center pt-8 md:justify-end md:pt-0">
          {/* gambar dan balonnya mengambang pelan bersama-sama */}
          <div className="float-slow relative">
            {/* balon sapaan di dekat jempol: menyembul, bertahan beberapa detik, mengecil hilang, lalu muncul lagi */}
            <div className="bubble-loop absolute -top-6 left-0 z-10 md:-left-10 md:-top-5">
              <p className="greeting-bubble relative rounded-full bg-ink px-4 py-2 font-ui text-sm font-semibold text-bg md:px-5 md:text-base">
                Sip, makasih udah mampir!
              </p>
            </div>
            <Image
              src="/oknum/yazid.png"
              alt={ALT}
              width={970}
              height={900}
              sizes="(min-width: 768px) 440px, 300px"
              className="h-auto w-[300px] md:w-[440px] dark:hidden"
            />
            <Image
              src="/oknum/yazid-gelap.png"
              alt={ALT}
              width={968}
              height={900}
              sizes="(min-width: 768px) 440px, 300px"
              className="hidden h-auto w-[300px] md:w-[440px] dark:block"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

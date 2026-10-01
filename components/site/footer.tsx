import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/site/social-icon";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";
import { getSocials } from "@/lib/socials";

/**
 * Footer selalu berwarna kebalikan dari tema: hitam di mode terang, terang di mode gelap.
 * Dua kolom: merek (logo, satu kalimat, hak cipta) dan media sosial (ikon, nama platform, nama akun). Di HP hak cipta selalu paling bawah.
 * Semua gambar logo di sini ikut dibalik di mode gelap (.theme-invert) supaya tetap kontras.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  // diisi dari halaman Akun saya di admin
  const activeSocials = await getSocials();

  return (
    <footer className="mt-auto bg-ink text-bg">
      <Container className="grid gap-x-10 gap-y-8 py-10 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-y-4">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label={`${site.name}, ke beranda`} className="flex items-center gap-2.5 self-start">
            {/* kotak logo berwarna latar halaman, jadi kontras dengan footer */}
            <span className="flex h-11 w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-bg">
              <Image
                src="/logo/yacuap-mark.png"
                alt=""
                width={30}
                height={27}
                className="theme-invert h-[27px] w-auto"
              />
            </span>
            <span className="flex flex-col">
              <Image
                src="/logo/yacuap-wordmark-putih.png"
                alt={site.name}
                width={83}
                height={28}
                className="theme-invert h-7 w-auto"
              />
              <span className="-mt-0.5 pl-[3px] font-display text-[13px] italic text-bg/65">{site.tagline}</span>
            </span>
          </Link>
          <p className="max-w-[38ch] text-[17px] leading-snug text-bg/75">
            Apa aja yang lewat di kepala, ditulis di sini. Boleh didengerin, boleh dicuekin.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:col-start-2 sm:row-span-2 sm:row-start-1">
          <h2 className="font-ui text-xs font-semibold uppercase tracking-[0.1em] text-bg/60">
            Ketemu di tempat lain
          </h2>
          {activeSocials.length > 0 ? (
            // tiap akun: ikon di kotak bergaris, nama platform, lalu nama akunnya. Dua per baris, termasuk di HP; hanya di tablet (kolomnya sempit) satu per baris.
            <ul className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-1 sm:gap-x-6 lg:grid-cols-2">
              {activeSocials.map((social) => (
                <li key={`${social.platform}-${social.url}`} className="min-w-0">
                  <a href={social.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 sm:gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-bg/25 transition-colors group-hover:border-bg group-hover:bg-bg group-hover:text-ink">
                      <SocialIcon platform={social.platform} className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-display text-[17px] leading-tight">{social.label}</span>
                      {/* nomor WhatsApp ditulis apa adanya, tanpa "@" */}
                      {social.handle ? (
                        <span className="truncate font-ui text-[13px] text-bg/60">
                          {social.platform === "whatsapp" ? social.handle : `@${social.handle}`}
                        </span>
                      ) : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[17px] text-bg/75">Belum ada, nih. Nyusul ya.</p>
          )}
        </div>

        {/* HP: paling bawah, setelah media sosial. Layar lebar: di kolom kiri, di bawah kalimat merek. */}
        <p className="font-ui text-[13px] text-bg/60 sm:col-start-1 sm:row-start-2">
          © {year} {site.name}
        </p>
      </Container>
    </footer>
  );
}

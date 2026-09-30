import type { Metadata } from "next";
import { Logo, LogoOnDark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk admin",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  "bukan-admin": "Akun ini bukan admin.",
};

/**
 * Halaman masuk: satu kartu di tengah layar dengan dua sisi, diadaptasi dari SINUS × PASSAGA.
 * Kiri: panel merek bertinta (kebalikan tema, seperti footer) berisi logo, kalimat besar, dan keterangan kecil.
 * Kanan: formulir. Di layar sempit panel merek disembunyikan dan logo pindah ke atas formulir.
 * Tombol tema ada di pojok kanan atas layar, di luar kartu.
 */
export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  const initialError = typeof error === "string" ? errors[error] : undefined;

  return (
    <main className="flex min-h-svh w-full flex-1 items-center justify-center p-5 sm:p-6">
      <div className="fixed right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* di mode gelap bayangan hitam tidak kelihatan, jadi diganti pendar terang di sekeliling kartu */}
      <div className="grid w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-surface shadow-xl md:grid-cols-2 dark:border-border-strong dark:shadow-[0_0_70px_-8px_rgba(255,255,255,0.22)]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-bg md:flex">
          {/* cahaya samar di pojok, supaya panelnya tidak rata */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-bg/10 blur-3xl" />
          <div className="relative">
            <LogoOnDark height={34} />
          </div>
          <h2 className="relative mt-auto max-w-[15ch] text-balance pt-24 font-display text-[1.75rem] font-medium leading-[1.15] tracking-[-0.01em]">
            Nulis, ngoceh, sama ngatur lagu. Semuanya dari sini.
          </h2>
          <p className="relative mt-6 font-ui text-xs text-bg/70">Area khusus {site.author}</p>
        </div>

        <div className="flex flex-col justify-center gap-5 p-5 sm:p-8">
          <div className="md:hidden">
            <Logo height={36} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-medium">Balik lagi, nih.</h1>
            <p className="font-ui text-sm text-muted">Masuk dulu, baru bisa nulis dan ngatur isi situsnya.</p>
          </div>
          {isSupabaseConfigured() ? (
            <>
              <LoginForm initialError={initialError} />
              <p className="text-center font-ui text-xs text-muted">Ini pintu buat yang nulis aja. Kalau cuma mau baca, nggak usah masuk.</p>
            </>
          ) : (
            <p className="rounded-[10px] border border-line bg-bg p-4 font-ui text-sm text-ink-soft">
              Supabase belum dikonfigurasi. Salin .env.example ke .env.local, isi URL serta kuncinya, lalu jalankan
              ulang server.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

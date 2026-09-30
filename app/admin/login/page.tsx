import type { Metadata } from "next";
import { Logo } from "@/components/site/logo";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk admin",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  "bukan-admin": "Akun ini bukan admin.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  const initialError = typeof error === "string" ? errors[error] : undefined;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-16">
      <Logo height={44} />
      <Card className="flex w-full max-w-sm flex-col gap-6 p-7">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-medium">Masuk admin</h1>
          <p className="font-ui text-sm text-muted">Khusus penulis. Pembaca nggak perlu akun.</p>
        </div>
        {isSupabaseConfigured() ? null : (
          <p className="rounded-[10px] border border-line bg-bg p-3 font-ui text-[13px] text-ink-soft">
            Supabase belum dikonfigurasi. Salin .env.example ke .env.local dan isi URL serta kuncinya.
          </p>
        )}
        <LoginForm initialError={initialError} />
      </Card>
    </main>
  );
}

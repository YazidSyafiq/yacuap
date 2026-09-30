import "server-only";
import { platformLabel } from "@/lib/platforms";
import { socials as fallbackSocials } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export type Social = { label: string; handle: string; url: string };

type Item = { platform?: string; label?: string; username?: string; url?: string };

/**
 * Media sosial untuk footer, diisi dari halaman Akun Saya di admin dan boleh lebih dari satu.
 * Profilnya sendiri privat; yang diambil di sini hanya daftar media sosialnya, lewat fungsi `site_socials`.
 * Hanya yang tautannya terisi yang dikembalikan. Kalau gagal, pakai daftar di lib/site.ts.
 */
export async function getSocials(): Promise<Social[]> {
  const fallback = fallbackSocials.filter((social) => social.url);
  if (!isSupabaseConfigured()) return fallback;
  try {
    const { data, error } = await createPublicClient().rpc("site_socials");
    if (error || !Array.isArray(data)) return fallback;
    return (data as Item[])
      .filter((item) => item.url)
      .map((item) => ({
        label: item.label || platformLabel(item.platform ?? ""),
        handle: item.username ?? "",
        url: item.url ?? "",
      }));
  } catch {
    return fallback;
  }
}

import "server-only";
import { platformLabel } from "@/lib/platforms";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/** `platform` menentukan ikonnya di footer; yang tidak dikenal jadi "lainnya". */
export type Social = { platform: string; label: string; handle: string; url: string };

type Item = { platform?: string; label?: string; username?: string; url?: string };

/**
 * Media sosial untuk footer, diisi dari halaman Akun Saya di admin dan boleh lebih dari satu.
 * Profilnya sendiri privat; yang diambil di sini hanya daftar media sosialnya, lewat fungsi `site_socials`.
 * Hanya yang tautannya terisi yang dikembalikan. Tidak ada cadangan di kode: kalau gagal atau kosong, footer tanpa media sosial.
 */
export async function getSocials(): Promise<Social[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient().rpc("site_socials");
    if (error || !Array.isArray(data)) return [];
    return (data as Item[])
      .filter((item) => item.url)
      .map((item) => ({
        platform: item.platform ?? "lainnya",
        label: item.label || platformLabel(item.platform ?? ""),
        handle: item.username ?? "",
        url: item.url ?? "",
      }));
  } catch {
    return [];
  }
}

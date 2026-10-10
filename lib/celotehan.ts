import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Ocehan: tulisan sebaris, pendamping cerita yang panjang.
 * Tampil di bagian Ocehan di beranda dan di balon kerumunan hero.
 *
 * Sumbernya hanya tabel `celotehan`. Tidak ada data contoh atau cadangan di kode (dihapus 10 Oktober 2026):
 * kalau tabelnya kosong, hero tanpa balon dan bagian Ocehan menampilkan keterangan kosong.
 */
/** Semua ocehan terbit, terbaru dulu. Tidak pernah melempar galat: kalau gagal atau kosong, daftar kosong. */
export async function getCelotehan(limit = 40): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from("celotehan")
      .select("body")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => String(row.body));
  } catch {
    return [];
  }
}

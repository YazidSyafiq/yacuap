import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { OCEHAN_AWAL } from "@/lib/ocehan-awal";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Ocehan: tulisan sebaris, pendamping cerita yang panjang.
 * Tampil di bagian Ocehan di beranda dan di balon kerumunan hero.
 *
 * Sumbernya tabel `celotehan`. Selama tabel itu kosong (atau Supabase belum tersambung),
 * dipakai OCEHAN_AWAL: seratus kalimat milik penulis dari docs/ocehan-awal.txt.
 */
/** Semua ocehan, terbaru dulu. Tidak pernah melempar galat: kalau gagal atau kosong, pakai ocehan awal. */
export async function getCelotehan(limit = 40): Promise<string[]> {
  if (!isSupabaseConfigured()) return [...OCEHAN_AWAL];
  try {
    const { data, error } = await createPublicClient()
      .from("celotehan")
      .select("body")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data || data.length === 0) return [...OCEHAN_AWAL];
    return data.map((row) => String(row.body));
  } catch {
    return [...OCEHAN_AWAL];
  }
}

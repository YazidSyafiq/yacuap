import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Celotehan: tulisan sebaris, pendamping cerita yang panjang. Muncul di balon kerumunan di beranda.
 *
 * CONTOH dipakai selama tabel `celotehan` belum ada isinya (atau Supabase belum disambungkan).
 * Ini hanya pengisi sementara, bukan kata-kata asli penulis, kecuali yang pertama.
 */
const CONTOH = [
  "YaAllah pengen 1M",
  "niatnya cuma lima menit",
  "kok udah Senin lagi",
  "laper tapi males",
  "besok aja deh",
  "lagu ini lagi, lagu ini lagi",
  "ngantuk tapi belum mau tidur",
  "kopi dulu baru mikir",
  "ya gitu deh",
  "tadi mau ngapain ya",
];

/** Celotehan terbaru untuk balon di beranda. Tidak pernah melempar galat: kalau gagal, pakai contoh. */
export async function getCelotehan(limit = 40): Promise<string[]> {
  if (!isSupabaseConfigured()) return CONTOH;
  try {
    const { data, error } = await createPublicClient()
      .from("celotehan")
      .select("body")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data || data.length === 0) return CONTOH;
    return data.map((row) => String(row.body));
  } catch {
    return CONTOH;
  }
}

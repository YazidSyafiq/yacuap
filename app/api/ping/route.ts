import { createPublicClient } from "@/lib/supabase/public";

// selalu dijalankan di server, tidak boleh dibekukan jadi statis: tujuannya memang menyentuh database
export const dynamic = "force-dynamic";

/**
 * Ping harian supaya project Supabase paket gratis tidak dijeda karena tidak dipakai seminggu.
 * Dipanggil Vercel Cron (lihat vercel.json). Menghitung baris `posts` lewat klien publik tanpa mengambil datanya.
 */
export async function GET() {
  const supabase = createPublicClient();
  const { count, error } = await supabase.from("posts").select("id", { count: "exact", head: true });
  if (error) return Response.json({ ok: false, pesan: error.message }, { status: 500 });
  return Response.json({ ok: true, tulisan: count ?? 0, pada: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}

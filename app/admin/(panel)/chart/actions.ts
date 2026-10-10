"use server";

import { revalidatePath } from "next/cache";
import { ensureTrack } from "@/lib/admin/tracks";
import { requireAdmin } from "@/lib/auth";
import { CHART_SIZE } from "@/lib/chart";

export type FormState = { error?: string; ok?: string } | undefined;

/** Halaman yang memuat chart disegarkan setiap ada perubahan. */
function refresh() {
  revalidatePath("/");
  revalidatePath("/chart");
  revalidatePath("/playlist");
  revalidatePath("/admin/chart");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

async function currentOrder(supabase: Supabase) {
  const { data } = await supabase.from("chart_tracks").select("track_id, position").order("position", { ascending: true });
  return (data ?? []).map((row) => String(row.track_id));
}

/** Urutan ditulis ulang supaya selalu rapat 1, 2, 3, ... (paling banyak 20). */
async function renumber(supabase: Supabase, order: string[]) {
  // dua tahap supaya tidak melanggar batas posisi saat baris bertukar tempat
  await Promise.all(order.map((id, i) => supabase.from("chart_tracks").update({ position: i + 1 }).eq("track_id", id)));
}

/** Tambah lagu ke chart: dari lagu yang sudah ada (`trackId`) atau tautan YouTube baru (`url`). Paling banyak 20. */
export async function addChartTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const order = await currentOrder(supabase);
  if (order.length >= CHART_SIZE) return { error: `Chart sudah penuh, ${CHART_SIZE} lagu. Keluarkan satu dulu.` };

  let trackId = text(formData, "trackId");
  if (!trackId) {
    const result = await ensureTrack(supabase, text(formData, "url"));
    if ("error" in result) return { error: result.error };
    trackId = result.id;
  }

  const { error } = await supabase.from("chart_tracks").insert({ track_id: trackId, note: text(formData, "note"), position: order.length + 1 });
  if (error) return { error: error.code === "23505" ? "Lagu ini sudah ada di chart." : "Lagunya gagal ditambahkan. Coba lagi." };
  refresh();
  return { ok: "Lagunya masuk chart." };
}

/**
 * Simpan seluruh susunan chart sekaligus dari editor: urutan (posisi mengikuti urutan array), posisi minggu lalu,
 * dan catatan tiap lagu. Lagu yang tidak ada di tabel diabaikan; lagu yang ada di tabel tapi tidak dikirim tidak disentuh.
 */
export async function saveChart(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  let rows: { id: string; lastPosition: number | null; note: string }[];
  try {
    const parsed = JSON.parse(text(formData, "payload")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("bukan daftar");
    rows = parsed.map((row) => {
      const item = row as { id?: unknown; lastPosition?: unknown; note?: unknown };
      const last = Number(item.lastPosition);
      return {
        id: String(item.id ?? ""),
        lastPosition: Number.isFinite(last) && last > 0 ? Math.round(last) : null,
        note: String(item.note ?? "").trim().slice(0, 400),
      };
    });
  } catch {
    return { error: "Datanya tidak terbaca. Muat ulang halaman lalu coba lagi." };
  }
  if (rows.length > CHART_SIZE) return { error: `Chart paling banyak ${CHART_SIZE} lagu.` };

  const existing = new Set(await currentOrder(supabase));
  const kept = rows.filter((row) => existing.has(row.id));
  if (kept.length !== existing.size) return { error: "Daftar lagunya berubah di tempat lain. Muat ulang halaman lalu coba lagi." };

  const results = await Promise.all(
    kept.map((row, i) => supabase.from("chart_tracks").update({ position: i + 1, last_position: row.lastPosition, note: row.note }).eq("track_id", row.id)),
  );
  if (results.some((result) => result.error)) return { error: "Sebagian gagal disimpan. Muat ulang halaman untuk melihat keadaan terakhir." };
  refresh();
  return { ok: "Tersimpan." };
}

/** Keluarkan lagu dari chart; lagunya sendiri tetap tersimpan dan bisa dipakai playlist. */
export async function removeChartTrack(formData: FormData) {
  const { supabase } = await requireAdmin();
  const trackId = text(formData, "trackId");
  if (!trackId) return;
  await supabase.from("chart_tracks").delete().eq("track_id", trackId);
  await renumber(supabase, await currentOrder(supabase));
  refresh();
}

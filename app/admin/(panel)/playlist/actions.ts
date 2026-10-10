"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureTrack } from "@/lib/admin/tracks";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

/** Halaman publik dan admin yang memuat playlist disegarkan setiap ada perubahan. */
function refresh() {
  revalidatePath("/");
  revalidatePath("/playlist");
  revalidatePath("/playlist/[slug]", "page");
  revalidatePath("/admin/playlist");
  revalidatePath("/admin/playlist/[id]", "page");
  revalidatePath("/admin/chart");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

// ---------------------------------------------------------------- playlist

/** Playlist baru: nama dan keterangan, status draf. Setelah jadi, langsung ke halaman pengelolanya. */
export async function createPlaylist(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const name = text(formData, "name");
  if (!name) return { error: "Namanya tidak boleh kosong." };
  const base = slugify(name) || "playlist";

  // slug harus unik: kalau sudah dipakai, diberi angka di belakangnya
  const { data: taken } = await supabase.from("playlists").select("slug").like("slug", `${base}%`);
  const used = new Set((taken ?? []).map((row) => String(row.slug)));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const { data, error } = await supabase
    .from("playlists")
    .insert({ name, slug, description: text(formData, "description"), status: "draft" })
    .select("id")
    .single();
  if (error || !data) return { error: "Gagal membuat playlist. Coba lagi." };

  refresh();
  redirect(`/admin/playlist/${data.id}`);
}

/** Nama, keterangan, dan tulisan terkait. */
export async function updatePlaylist(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) return { error: "Playlistnya tidak ditemukan." };
  if (!name) return { error: "Namanya tidak boleh kosong." };

  const { error } = await supabase
    .from("playlists")
    .update({ name, description: text(formData, "description"), post_id: text(formData, "postId") || null })
    .eq("id", id);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };

  refresh();
  return { ok: "Tersimpan." };
}

/** Hapus playlist beserta susunannya (lagunya sendiri tetap ada di tabel lagu, bisa dipakai playlist lain dan chart). */
export async function deletePlaylist(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;
  await supabase.from("playlists").delete().eq("id", id);
  refresh();
  if (text(formData, "back") === "list") redirect("/admin/playlist");
}

/** Terbitkan atau jadikan draf. */
export async function setPlaylistStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status") === "published" ? "published" : "draft";
  if (!id) return;
  await supabase.from("playlists").update({ status }).eq("id", id);
  refresh();
}

// ---------------------------------------------------------------- lagu

/** Tambah lagu ke playlist: dari lagu yang sudah ada (`trackId`) atau tautan YouTube baru (`url`). */
export async function addTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  if (!playlistId) return { error: "Playlistnya tidak ditemukan." };

  let trackId = text(formData, "trackId");
  if (!trackId) {
    const result = await ensureTrack(supabase, text(formData, "url"));
    if ("error" in result) return { error: result.error };
    trackId = result.id;
  }

  const { data: last } = await supabase
    .from("playlist_tracks")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("playlist_tracks").insert({
    playlist_id: playlistId,
    track_id: trackId,
    note: text(formData, "note"),
    position: (last?.position ?? 0) + 1,
  });
  if (error) {
    return { error: error.code === "23505" ? "Lagu ini sudah ada di playlist." : "Lagunya gagal ditambahkan. Coba lagi." };
  }

  refresh();
  return { ok: "Lagunya masuk." };
}

/** Urutan ditulis ulang supaya selalu rapat 1, 2, 3, ... */
async function renumber(supabase: Supabase, playlistId: string, order: string[]) {
  await Promise.all(
    order.map((id, i) =>
      supabase.from("playlist_tracks").update({ position: i + 1 }).eq("playlist_id", playlistId).eq("track_id", id),
    ),
  );
}

async function currentOrder(supabase: Supabase, playlistId: string) {
  const { data } = await supabase
    .from("playlist_tracks")
    .select("track_id, position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });
  return (data ?? []).map((row) => String(row.track_id));
}

/** Judul dan artis, berlaku di semua playlist dan chart yang memuat lagu ini. */
export async function updateTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const trackId = text(formData, "trackId");
  const title = text(formData, "title");
  if (!trackId) return { error: "Lagunya tidak ditemukan." };
  if (!title) return { error: "Judulnya tidak boleh kosong." };

  const { error } = await supabase.from("tracks").update({ title, artist: text(formData, "artist") }).eq("id", trackId);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };
  refresh();
  return { ok: "Tersimpan." };
}

/**
 * Simpan seluruh susunan playlist sekaligus dari editor: urutan (posisi mengikuti urutan array) dan catatan tiap lagu.
 * Lagu yang tidak ada di playlist diabaikan; kalau daftarnya berubah di tempat lain, ditolak supaya tidak saling timpa.
 */
export async function savePlaylist(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  if (!playlistId) return { error: "Playlistnya tidak ditemukan." };
  let rows: { id: string; note: string }[];
  try {
    const parsed = JSON.parse(text(formData, "payload")) as unknown;
    if (!Array.isArray(parsed)) throw new Error("bukan daftar");
    rows = parsed.map((row) => {
      const item = row as { id?: unknown; note?: unknown };
      return { id: String(item.id ?? ""), note: String(item.note ?? "").trim().slice(0, 400) };
    });
  } catch {
    return { error: "Datanya tidak terbaca. Muat ulang halaman lalu coba lagi." };
  }

  const existing = new Set(await currentOrder(supabase, playlistId));
  const kept = rows.filter((row) => existing.has(row.id));
  if (kept.length !== existing.size) return { error: "Daftar lagunya berubah di tempat lain. Muat ulang halaman lalu coba lagi." };

  const results = await Promise.all(
    kept.map((row, i) => supabase.from("playlist_tracks").update({ position: i + 1, note: row.note }).eq("playlist_id", playlistId).eq("track_id", row.id)),
  );
  if (results.some((result) => result.error)) return { error: "Sebagian gagal disimpan. Muat ulang halaman untuk melihat keadaan terakhir." };
  refresh();
  return { ok: "Tersimpan." };
}

export async function removeTrack(formData: FormData) {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  const trackId = text(formData, "trackId");
  if (!playlistId || !trackId) return;

  await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
  await renumber(supabase, playlistId, await currentOrder(supabase, playlistId));
  refresh();
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { buildTrackArtwork, fetchYoutubeInfo, parseYoutubeId } from "@/lib/youtube";

export type FormState = { error?: string; ok?: string } | undefined;

/** Halaman publik yang memuat playlist disegarkan setiap ada perubahan dari admin. */
function refresh() {
  revalidatePath("/");
  revalidatePath("/playlist");
  revalidatePath("/admin/playlist");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Nama dan keterangan playlist. Playlistnya cuma satu, jadi tidak ada buat baru atau hapus. */
export async function updatePlaylist(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) return { error: "Playlistnya tidak ditemukan." };
  if (!name) return { error: "Namanya tidak boleh kosong." };

  const { error } = await supabase
    .from("playlists")
    .update({ name, description: text(formData, "description") })
    .eq("id", id);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };

  refresh();
  return { ok: "Tersimpan." };
}

export async function addTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  const youtubeId = parseYoutubeId(text(formData, "url"));
  if (!playlistId) return { error: "Playlistnya tidak ditemukan." };
  if (!youtubeId) return { error: "Tautannya bukan tautan video YouTube." };

  // lagu yang sudah pernah disimpan dipakai lagi, tidak dibuat dua kali
  const { data: existing } = await supabase.from("tracks").select("id").eq("youtube_id", youtubeId).maybeSingle();
  let trackId = existing?.id as string | undefined;

  if (!trackId) {
    const info = await fetchYoutubeInfo(youtubeId);
    if (!info) return { error: "Videonya tidak ketemu, atau tidak boleh ditampilkan di luar YouTube." };

    // sampul: thumbnail YouTube yang sudah dijadikan hitam putih, disimpan di bucket covers
    let artworkPath: string | null = null;
    const artwork = await buildTrackArtwork(youtubeId);
    if (artwork) {
      const path = `tracks/${youtubeId}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(path, artwork, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
      if (!uploadError) artworkPath = path;
    }

    const { data: created, error } = await supabase
      .from("tracks")
      .insert({ title: info.title, artist: info.artist, youtube_id: youtubeId, artwork_path: artworkPath })
      .select("id")
      .single();
    if (error || !created) return { error: "Lagunya gagal disimpan. Coba lagi." };
    trackId = created.id as string;
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
  return { ok: "Lagunya masuk. Judul dan artisnya bisa dirapikan di bawah." };
}

export async function updateTrack(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  const trackId = text(formData, "trackId");
  const title = text(formData, "title");
  if (!playlistId || !trackId) return { error: "Lagunya tidak ditemukan." };
  if (!title) return { error: "Judulnya tidak boleh kosong." };

  const track = await supabase.from("tracks").update({ title, artist: text(formData, "artist") }).eq("id", trackId);
  const note = await supabase
    .from("playlist_tracks")
    .update({ note: text(formData, "note") })
    .eq("playlist_id", playlistId)
    .eq("track_id", trackId);
  if (track.error || note.error) return { error: "Gagal menyimpan. Coba lagi." };

  refresh();
  return { ok: "Tersimpan." };
}

/** Menggeser lagu satu tingkat ke atas (-1) atau ke bawah (+1). Urutan ditulis ulang supaya selalu rapat 1, 2, 3, ... */
async function shiftTrack(formData: FormData, step: -1 | 1) {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  const trackId = text(formData, "trackId");
  if (!playlistId || !trackId) return;

  const { data } = await supabase
    .from("playlist_tracks")
    .select("track_id, position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });
  const order = (data ?? []).map((row) => String(row.track_id));
  const from = order.indexOf(trackId);
  const to = from + step;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to], order[from]];

  await Promise.all(
    order.map((id, i) =>
      supabase.from("playlist_tracks").update({ position: i + 1 }).eq("playlist_id", playlistId).eq("track_id", id),
    ),
  );

  refresh();
}

export async function moveTrackUp(formData: FormData) {
  await shiftTrack(formData, -1);
}

export async function moveTrackDown(formData: FormData) {
  await shiftTrack(formData, 1);
}

export async function removeTrack(formData: FormData) {
  const { supabase } = await requireAdmin();
  const playlistId = text(formData, "playlistId");
  const trackId = text(formData, "trackId");
  if (!playlistId || !trackId) return;

  await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
  refresh();
}

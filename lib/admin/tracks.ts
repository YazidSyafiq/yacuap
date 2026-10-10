import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTrackArtwork, fetchYoutubeInfo, parseYoutubeId } from "@/lib/youtube";

/**
 * Mencari atau membuat baris `tracks` dari tautan YouTube: judul, artis, dan sampul monokrom diambil otomatis.
 * Lagu yang sudah pernah disimpan dipakai lagi, tidak dibuat dua kali. Mengembalikan id lagunya atau pesan galat.
 */
export async function ensureTrack(supabase: SupabaseClient, url: string): Promise<{ id: string } | { error: string }> {
  const youtubeId = parseYoutubeId(url);
  if (!youtubeId) return { error: "Tautannya bukan tautan video YouTube." };

  const { data: existing } = await supabase.from("tracks").select("id").eq("youtube_id", youtubeId).maybeSingle();
  if (existing?.id) return { id: String(existing.id) };

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
  return { id: String(created.id) };
}

/** Lagu yang dipilih admin dari daftar yang sudah ada (di playlist mana pun atau di chart). */
export type TrackOption = { id: string; title: string; artist: string; artwork: string | null };

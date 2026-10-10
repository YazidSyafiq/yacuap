import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackOption } from "@/lib/admin/tracks";
import { coverUrl } from "@/lib/playlist";

/** Semua lagu tersimpan, terbaru dulu, untuk pemilih "dari yang sudah ada". */
export async function getTrackOptions(supabase: SupabaseClient): Promise<TrackOption[]> {
  const { data } = await supabase.from("tracks").select("id, title, artist, artwork_path").order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({ id: String(row.id), title: String(row.title), artist: String(row.artist ?? ""), artwork: coverUrl(row.artwork_path as string | null) }));
}

/** Tulisan terbit yang bisa dikaitkan ke playlist. */
export async function getPostOptions(supabase: SupabaseClient): Promise<{ id: string; title: string }[]> {
  const { data } = await supabase.from("posts").select("id, title").eq("status", "published").order("published_at", { ascending: false });
  return (data ?? []).map((row) => ({ id: String(row.id), title: String(row.title) }));
}

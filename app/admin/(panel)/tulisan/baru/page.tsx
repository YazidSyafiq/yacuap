import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { PostEditor, type EditorTag, type EditorTrack } from "../[id]/post-editor";

export const metadata: Metadata = { title: "Tulis Baru" };

/**
 * Editor kosong untuk tulisan baru. Tidak ada yang disimpan saat halaman ini dibuka:
 * tulisannya baru dibuat di database ketika tombol simpan atau terbitkan ditekan.
 */
export default async function NewPostPage() {
  const { supabase } = await requireAdmin();
  const [{ data: tagRows }, { data: trackRows }] = await Promise.all([
    supabase.from("tags").select("id, name, position").order("position", { ascending: true }).order("name", { ascending: true }),
    supabase.from("tracks").select("id, title, artist, youtube_id, artwork_path").order("created_at", { ascending: false }),
  ]);
  const tracks: EditorTrack[] = (trackRows ?? []).map((row) => ({
    id: String(row.id),
    youtubeId: String(row.youtube_id),
    title: String(row.title),
    artist: String(row.artist),
    artwork: coverUrl(row.artwork_path as string | null),
  }));

  return (
    <PostEditor
      post={{ id: "", title: "", slug: "", excerpt: "", content: null, cover: null, published: false, tagIds: [] }}
      tags={(tagRows ?? []) as EditorTag[]}
      tracks={tracks}
    />
  );
}

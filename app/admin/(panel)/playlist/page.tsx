import type { Metadata } from "next";
import { getPostOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { PlaylistList, type PlaylistListItem } from "./list-forms";

export const metadata: Metadata = { title: "Playlist" };

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  post_id: string | null;
  updated_at: string;
  posts: { title: string } | null;
  playlist_tracks: { position: number; tracks: { artwork_path: string | null } | null }[];
};

/** Semua playlist (termasuk draf) sebagai tabel. Isi tiap playlist diatur di /admin/playlist/[id]. */
export default async function AdminPlaylistsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, posts] = await Promise.all([
    supabase
      .from("playlists")
      .select("id, name, slug, description, status, post_id, updated_at, posts(title), playlist_tracks(position, tracks(artwork_path))")
      .order("updated_at", { ascending: false }),
    getPostOptions(supabase),
  ]);

  const playlists: PlaylistListItem[] = ((data ?? []) as unknown as Row[]).map((row) => {
    const items = [...row.playlist_tracks].sort((a, b) => a.position - b.position);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      postId: row.post_id,
      updatedAt: row.updated_at,
      storyTitle: row.posts?.title ?? null,
      trackCount: items.length,
      artworks: items.flatMap((item) => (item.tracks?.artwork_path ? [coverUrl(item.tracks.artwork_path) as string] : [])).slice(0, 4),
    };
  });

  return <PlaylistList playlists={playlists} posts={posts} />;
}

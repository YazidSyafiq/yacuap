import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostOptions, getTrackOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { PlaylistManager, type Track } from "../forms";

export const metadata: Metadata = { title: "Playlist" };

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  post_id: string | null;
  playlist_tracks: { note: string; position: number; tracks: { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null } | null }[];
};

const SELECT = "id, name, slug, description, status, post_id, playlist_tracks(note, position, tracks(id, title, artist, youtube_id, artwork_path))";

/** Mengatur isi satu playlist: lagu, urutan, catatan. */
export default async function AdminPlaylistPage({ params }: PageProps<"/admin/playlist/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data }, posts, options] = await Promise.all([supabase.from("playlists").select(SELECT).eq("id", id).maybeSingle(), getPostOptions(supabase), getTrackOptions(supabase)]);
  if (!data) notFound();

  const playlist = data as unknown as Row;
  const tracks: Track[] = [...playlist.playlist_tracks]
    .sort((a, b) => a.position - b.position)
    .flatMap((item) =>
      item.tracks
        ? [{ id: item.tracks.id, title: item.tracks.title, artist: item.tracks.artist, youtubeId: item.tracks.youtube_id, artwork: coverUrl(item.tracks.artwork_path), note: item.note }]
        : [],
    );

  return (
    <PlaylistManager
      playlist={{ id: playlist.id, name: playlist.name, slug: playlist.slug, description: playlist.description, status: playlist.status, postId: playlist.post_id }}
      tracks={tracks}
      posts={posts}
      options={options}
    />
  );
}

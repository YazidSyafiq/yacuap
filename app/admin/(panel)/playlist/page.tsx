import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { PlaylistManager, type Track } from "./forms";

export const metadata: Metadata = { title: "Playlist" };

type Row = {
  id: string;
  name: string;
  description: string;
  playlist_tracks: {
    note: string;
    position: number;
    tracks: { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null } | null;
  }[];
};

const SELECT =
  "id, name, description, playlist_tracks(note, position, tracks(id, title, artist, youtube_id, artwork_path))";

/**
 * Situs ini hanya punya satu playlist, jadi halaman ini langsung mengatur isinya.
 * Kalau playlistnya belum ada, dibuat saat halaman ini pertama kali dibuka.
 */
export default async function AdminPlaylistPage() {
  const { supabase } = await requireAdmin();

  const find = () =>
    supabase
      .from("playlists")
      .select(SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

  let { data } = await find();
  if (!data) {
    await supabase
      .from("playlists")
      .insert({ name: "Lagi sering muter ini", slug: "utama", status: "published", is_featured: true });
    ({ data } = await find());
  }
  if (!data) {
    return <p className="text-sm text-muted">Playlistnya gagal disiapkan. Coba muat ulang halaman ini.</p>;
  }

  const playlist = data as unknown as Row;
  const tracks: Track[] = [...playlist.playlist_tracks]
    .sort((a, b) => a.position - b.position)
    .flatMap((item) =>
      item.tracks
        ? [
            {
              id: item.tracks.id,
              title: item.tracks.title,
              artist: item.tracks.artist,
              youtubeId: item.tracks.youtube_id,
              artwork: coverUrl(item.tracks.artwork_path),
              note: item.note,
            },
          ]
        : [],
    );

  return (
    <PlaylistManager
      playlist={{ id: playlist.id, name: playlist.name, description: playlist.description }}
      tracks={tracks}
    />
  );
}

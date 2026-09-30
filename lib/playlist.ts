import "server-only";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/** Satu lagu di dalam playlist, sudah siap ditampilkan dan diputar. */
export type PlaylistTrack = {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  /** Alamat sampul yang sudah monokrom, atau null kalau belum ada. */
  artwork: string | null;
  /** Catatan kenapa lagu ini masuk. Boleh kosong. */
  note: string;
};

export type Playlist = {
  id: string;
  name: string;
  slug: string;
  description: string;
  tracks: PlaylistTrack[];
};

/** Alamat publik gambar di bucket `covers`. */
export function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${supabaseUrl}/storage/v1/object/public/covers/${path}`;
}

type TrackRow = { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null };
type PlaylistRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  playlist_tracks: { note: string; position: number; tracks: TrackRow | null }[] | null;
};

const SELECT =
  "id, name, slug, description, playlist_tracks(note, position, tracks(id, title, artist, youtube_id, artwork_path))";

function toPlaylist(row: PlaylistRow): Playlist {
  const tracks = [...(row.playlist_tracks ?? [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((item) =>
      item.tracks
        ? [
            {
              id: item.tracks.id,
              youtubeId: item.tracks.youtube_id,
              title: item.tracks.title,
              artist: item.tracks.artist,
              artwork: coverUrl(item.tracks.artwork_path),
              note: item.note,
            },
          ]
        : [],
    );
  return { id: row.id, name: row.name, slug: row.slug, description: row.description, tracks };
}

/**
 * Situs ini hanya punya satu playlist: daftar lagu yang lagi sering diputar.
 * Tabelnya tetap `playlists` supaya tidak perlu diubah kalau suatu saat mau lebih dari satu;
 * yang dipakai adalah playlist terbit yang paling lama dibuat.
 * Tidak pernah melempar galat: kalau gagal atau belum ada, hasilnya null.
 */
export async function getPlaylist(): Promise<Playlist | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient()
      .from("playlists")
      .select(SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const playlist = toPlaylist(data as unknown as PlaylistRow);
    return playlist.tracks.length > 0 ? playlist : null;
  } catch {
    return null;
  }
}

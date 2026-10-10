import "server-only";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export { CHART_SIZE } from "@/lib/chart";

/** Satu lagu di dalam playlist atau chart, sudah siap ditampilkan dan diputar. */
export type PlaylistTrack = {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  /** Alamat sampul yang sudah monokrom, atau null kalau belum ada. */
  artwork: string | null;
  /** Catatan kenapa lagu ini masuk. Boleh kosong. */
  note: string;
  /** Posisi minggu lalu di chart; null berarti baru masuk. Selalu null di playlist. */
  lastPosition: number | null;
  /** Sudah berapa minggu di chart. Selalu 0 di playlist. */
  weeks: number;
  /** Tanggal lagu ini pertama disimpan, ISO. Dipakai di daftar playlist sebagai keterangan tambahan. */
  addedAt: string;
};

/** Playlist biasa: disusun untuk suasana tertentu, tidak berganti tiap minggu. */
export type Playlist = {
  kind: "playlist";
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Tanggal dibuat, ISO. */
  createdAt: string;
  trackCount: number;
  /** Paling banyak empat sampul lagu pertama, untuk mosaik. */
  artworks: string[];
  tracks: PlaylistTrack[];
  /** Tulisan "cerita di balik playlist ini", kalau ada dan terbit. */
  story: { title: string; slug: string } | null;
};

/** Chart minggu ini: entitas sendiri, bukan playlist. Paling banyak 20 lagu, dengan gerak dari minggu lalu. */
export type Chart = {
  kind: "chart";
  /** Id tetap, dipakai sebagai penanda antrean pemutar. */
  id: "chart";
  name: string;
  description: string;
  chartFrom: string | null;
  chartTo: string | null;
  trackCount: number;
  artworks: string[];
  tracks: PlaylistTrack[];
  story: null;
};

/** Alamat publik gambar di bucket `covers`. */
export function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${supabaseUrl}/storage/v1/object/public/covers/${path}`;
}

type TrackRow = { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null; created_at: string };
type PlaylistRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  posts: { title: string; slug: string } | null;
  playlist_tracks: { note: string; position: number; tracks: TrackRow | null }[] | null;
};
type ChartRow = { title: string; description: string; chart_from: string | null; chart_to: string | null };
type ChartTrackRow = { note: string; position: number; last_position: number | null; weeks_on_chart: number; tracks: TrackRow | null };

const PLAYLIST_SELECT = "id, name, slug, description, created_at, posts(title, slug), playlist_tracks(note, position, tracks(id, title, artist, youtube_id, artwork_path, created_at))";

function toTrack(row: TrackRow, note: string, lastPosition: number | null, weeks: number): PlaylistTrack {
  return {
    id: row.id,
    youtubeId: row.youtube_id,
    title: row.title,
    artist: row.artist,
    artwork: coverUrl(row.artwork_path),
    note,
    lastPosition,
    weeks,
    addedAt: row.created_at,
  };
}

const artworksOf = (tracks: PlaylistTrack[]) => tracks.flatMap((track) => (track.artwork ? [track.artwork] : [])).slice(0, 4);

function toPlaylist(row: PlaylistRow): Playlist {
  const tracks = [...(row.playlist_tracks ?? [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((item) => (item.tracks ? [toTrack(item.tracks, item.note, null, 0)] : []));
  return {
    kind: "playlist",
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    trackCount: tracks.length,
    artworks: artworksOf(tracks),
    tracks,
    story: row.posts && row.posts.slug ? { title: row.posts.title, slug: row.posts.slug } : null,
  };
}

/** Semua playlist terbit yang punya lagu, yang terakhir diperbarui dulu. Tidak pernah melempar galat. */
export async function getPlaylists(): Promise<Playlist[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient().from("playlists").select(PLAYLIST_SELECT).eq("status", "published").order("updated_at", { ascending: false });
    if (error || !data) return [];
    return (data as unknown as PlaylistRow[]).map(toPlaylist).filter((playlist) => playlist.tracks.length > 0);
  } catch {
    return [];
  }
}

async function findPlaylist(column: "slug" | "id", value: string): Promise<Playlist | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient().from("playlists").select(PLAYLIST_SELECT).eq("status", "published").eq(column, value).maybeSingle();
    if (error || !data) return null;
    const playlist = toPlaylist(data as unknown as PlaylistRow);
    return playlist.tracks.length > 0 ? playlist : null;
  } catch {
    return null;
  }
}

/** Satu playlist terbit menurut slug-nya, untuk halaman /playlist/[slug]. */
export function getPlaylistBySlug(slug: string) {
  return findPlaylist("slug", slug);
}

/** Satu playlist terbit menurut id-nya, untuk kartu bagikan. */
export function getPlaylistById(id: string) {
  return findPlaylist("id", id);
}

/** Chart minggu ini, kalau ada isinya. Tidak pernah melempar galat. */
export async function getChart(): Promise<Chart | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const client = createPublicClient();
    const [{ data: chart }, { data: rows }] = await Promise.all([
      client.from("chart").select("title, description, chart_from, chart_to").maybeSingle(),
      client.from("chart_tracks").select("note, position, last_position, weeks_on_chart, tracks(id, title, artist, youtube_id, artwork_path, created_at)").order("position", { ascending: true }),
    ]);
    const tracks = ((rows ?? []) as unknown as ChartTrackRow[]).flatMap((item) => (item.tracks ? [toTrack(item.tracks, item.note, item.last_position, item.weeks_on_chart)] : []));
    if (!chart || tracks.length === 0) return null;
    const row = chart as ChartRow;
    return {
      kind: "chart",
      id: "chart",
      name: row.title,
      description: row.description,
      chartFrom: row.chart_from,
      chartTo: row.chart_to,
      trackCount: tracks.length,
      artworks: artworksOf(tracks),
      tracks,
      story: null,
    };
  } catch {
    return null;
  }
}

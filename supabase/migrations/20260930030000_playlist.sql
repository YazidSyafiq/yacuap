-- Yacuap, Phase 2: playlist.
-- Lagu (sumbernya YouTube), playlist, dan catatan per lagu. Lihat docs/PRD.md bagian 5.

-- ---------------------------------------------------------------------------
-- Lagu
-- Dipakai bersama oleh playlist, lagu pengiring tulisan, dan kartu lagu di dalam tulisan.
-- ---------------------------------------------------------------------------
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  artist text not null default '',
  album text not null default '',
  youtube_id text not null unique,
  duration_seconds integer check (duration_seconds > 0),
  artwork_path text,
  spotify_url text,
  created_at timestamptz not null default now(),
  constraint tracks_youtube_id_format check (youtube_id ~ '^[A-Za-z0-9_-]{11}$')
);

alter table public.tracks enable row level security;

create policy "publik membaca lagu"
  on public.tracks for select
  to anon, authenticated
  using (true);

create policy "admin mengelola lagu"
  on public.tracks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Playlist
-- ---------------------------------------------------------------------------
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique,
  description text not null default '',
  cover_path text,
  spotify_url text,
  youtube_url text,
  post_id uuid references public.posts (id) on delete set null,
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playlists_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- hanya satu playlist yang boleh tampil di beranda
create unique index playlists_satu_unggulan_idx on public.playlists (is_featured) where is_featured;
create index playlists_terbit_idx on public.playlists (updated_at desc) where status = 'published';

create trigger playlists_set_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();

alter table public.playlists enable row level security;

create policy "publik membaca playlist terbit"
  on public.playlists for select
  to anon, authenticated
  using (status = 'published');

create policy "admin mengelola playlist"
  on public.playlists for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Lagu di dalam playlist: urutan dan catatan kenapa lagu itu masuk
-- ---------------------------------------------------------------------------
create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  note text not null default '',
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

create index playlist_tracks_urutan_idx on public.playlist_tracks (playlist_id, position);
create index playlist_tracks_track_idx on public.playlist_tracks (track_id);

alter table public.playlist_tracks enable row level security;

-- isi playlist hanya terlihat kalau playlistnya terlihat (RLS playlists ikut berlaku di subquery)
create policy "publik membaca isi playlist terbit"
  on public.playlist_tracks for select
  to anon, authenticated
  using (exists (select 1 from public.playlists p where p.id = playlist_id));

create policy "admin mengelola isi playlist"
  on public.playlist_tracks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Lagu pengiring tulisan ("Putar sambil baca")
-- ---------------------------------------------------------------------------
alter table public.posts
  add column soundtrack_track_id uuid references public.tracks (id) on delete set null;

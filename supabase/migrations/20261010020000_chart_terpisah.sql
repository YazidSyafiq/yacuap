-- Chart mingguan dipisah dari playlist (keputusan 10 Oktober 2026): playlist tidak bisa jadi chart.
-- Chart satu baris (judul, keterangan, rentang minggu) dan isinya paling banyak 20 lagu dari tabel tracks,
-- yang juga dipakai playlist. Kolom chart di playlists/playlist_tracks dari migration sebelumnya dihapus.

create table public.chart (
  id boolean primary key default true check (id),
  title text not null default 'Yang paling sering kuputar minggu ini.',
  description text not null default '',
  chart_from date,
  chart_to date,
  updated_at timestamptz not null default now(),
  constraint chart_range check (chart_from is null or chart_to is null or chart_to >= chart_from)
);

create trigger chart_set_updated_at
  before update on public.chart
  for each row execute function public.set_updated_at();

alter table public.chart enable row level security;

create policy "publik membaca chart"
  on public.chart for select
  to anon, authenticated
  using (true);

create policy "admin mengelola chart"
  on public.chart for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.chart_tracks (
  track_id uuid primary key references public.tracks (id) on delete cascade,
  position integer not null check (position between 1 and 20),
  last_position integer check (last_position > 0),
  weeks_on_chart integer not null default 1 check (weeks_on_chart > 0),
  note text not null default '',
  added_at timestamptz not null default now()
);

create index chart_tracks_urutan_idx on public.chart_tracks (position);

alter table public.chart_tracks enable row level security;

create policy "publik membaca isi chart"
  on public.chart_tracks for select
  to anon, authenticated
  using (true);

create policy "admin mengelola isi chart"
  on public.chart_tracks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- satu-satunya baris chart
insert into public.chart (id) values (true);

-- isi chart contoh dipindahkan dari playlist yang tadinya ditandai chart (kalau ada), termasuk gerak dan catatannya
with featured as (select id, chart_from, chart_to from public.playlists where is_featured limit 1)
insert into public.chart_tracks (track_id, position, last_position, weeks_on_chart, note)
select pt.track_id, row_number() over (order by pt.position), pt.last_position, pt.weeks_on_chart, pt.note
from public.playlist_tracks pt join featured on featured.id = pt.playlist_id
order by pt.position
limit 20;

update public.chart
set chart_from = f.chart_from, chart_to = f.chart_to
from (select chart_from, chart_to from public.playlists where is_featured limit 1) f
where public.chart.id;

-- playlist yang tadinya chart kembali jadi playlist biasa; kolom chart di playlist dihapus
drop index if exists public.playlists_satu_unggulan_idx;
alter table public.playlists
  drop constraint if exists playlists_chart_range,
  drop column if exists is_featured,
  drop column if exists chart_from,
  drop column if exists chart_to;
alter table public.playlist_tracks
  drop column if exists last_position,
  drop column if exists weeks_on_chart;

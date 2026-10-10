-- Banyak playlist dan chart mingguan (docs/PRD.md, "Rencana: banyak playlist dan chart mingguan", 10 Oktober 2026).
-- Satu playlist ditandai is_featured = chart minggu ini (indeks unik playlists_satu_unggulan_idx sudah ada).

-- rentang minggu yang dicakup chart; kosong untuk playlist biasa
alter table public.playlists
  add column chart_from date,
  add column chart_to date,
  add constraint playlists_chart_range check (chart_from is null or chart_to is null or chart_to >= chart_from);

-- posisi minggu lalu (kosong = baru masuk) dan sudah berapa minggu di chart; hanya berarti di playlist chart
alter table public.playlist_tracks
  add column last_position integer check (last_position > 0),
  add column weeks_on_chart integer not null default 1 check (weeks_on_chart > 0);

-- kalau belum ada yang ditandai, playlist terbit yang paling lama (playlist "satu-satunya" dari versi sebelumnya) jadi chart
update public.playlists
set is_featured = true
where id = (select id from public.playlists where status = 'published' order by created_at asc limit 1)
  and not exists (select 1 from public.playlists where is_featured);

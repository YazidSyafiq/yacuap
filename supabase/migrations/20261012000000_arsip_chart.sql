-- Arsip chart mingguan (keputusan 11 Oktober 2026): tiap kali minggu maju, isi chart minggu yang baru lewat disimpan
-- utuh, supaya nanti bisa dilihat riwayatnya dan dihitung statistiknya (lagu paling lama bertahan, berapa kali masuk).
-- Judul dan artis ikut disalin, jadi arsipnya tetap utuh walau lagunya kelak dihapus dari tabel lagu.

create table public.chart_history (
  id uuid primary key default gen_random_uuid(),
  chart_from date not null,
  chart_to date not null,
  position integer not null check (position between 1 and 20),
  track_id uuid references public.tracks (id) on delete set null,
  title text not null,
  artist text not null default '',
  note text not null default '',
  last_position integer check (last_position > 0),
  weeks_on_chart integer not null default 1 check (weeks_on_chart > 0),
  archived_at timestamptz not null default now(),
  constraint chart_history_satu_posisi unique (chart_from, position)
);

create index chart_history_minggu_idx on public.chart_history (chart_from desc, position);
create index chart_history_lagu_idx on public.chart_history (track_id);

alter table public.chart_history enable row level security;

create policy "publik membaca arsip chart"
  on public.chart_history for select
  to anon, authenticated
  using (true);

create policy "admin mengelola arsip chart"
  on public.chart_history for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Pergantian minggu sekarang mengarsipkan dulu minggu yang baru lewat, baru memajukan rentang dan posisi minggu lalu.
-- Arsip satu minggu hanya ditulis sekali (kunci chart_from dan posisi), jadi aman dipanggil berulang.
create or replace function public.chart_rollover()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
  monday date := (date_trunc('week', (now() at time zone 'Asia/Jakarta')::date))::date;
  current_from date;
  current_to date;
begin
  select chart_from, chart_to into current_from, current_to from public.chart where id;
  if current_to is not null and current_to >= today then
    return false;
  end if;

  if current_to is not null then
    -- minggu yang baru lewat masuk arsip, lengkap dengan catatan, gerak, dan lama bertahannya saat itu
    insert into public.chart_history (chart_from, chart_to, position, track_id, title, artist, note, last_position, weeks_on_chart)
    select current_from, current_to, ct.position, ct.track_id, t.title, t.artist, ct.note, ct.last_position, ct.weeks_on_chart
    from public.chart_tracks ct
    join public.tracks t on t.id = ct.track_id
    on conflict (chart_from, position) do nothing;

    -- posisi sekarang jadi posisi minggu lalu, lama bertahan bertambah
    update public.chart_tracks set last_position = position, weeks_on_chart = weeks_on_chart + 1;
  end if;

  update public.chart set chart_from = monday, chart_to = monday + 6 where id;
  return true;
end;
$$;

revoke all on function public.chart_rollover() from public;
grant execute on function public.chart_rollover() to anon, authenticated;

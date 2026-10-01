-- Yacuap: statistik baca untuk dashboard admin.
-- Jumlah tulisan dibuka, per tulisan per hari (zona waktu WIB). Tidak menyimpan data pengunjung apa pun.
-- Pengunjung hanya bisa menambah hitungan lewat fungsi di bawah; membaca angkanya hanya admin.

create table public.post_views (
  post_id uuid not null references public.posts (id) on delete cascade,
  day date not null,
  views integer not null default 0 check (views >= 0),
  primary key (post_id, day)
);

create index post_views_day_idx on public.post_views (day);

alter table public.post_views enable row level security;

create policy "admin membaca statistik baca"
  on public.post_views for select
  to authenticated
  using (public.is_admin());

create or replace function public.record_post_view(post_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.post_views (post_id, day, views)
  select p.id, (now() at time zone 'Asia/Jakarta')::date, 1
  from public.posts p
  where p.slug = post_slug and p.status = 'published'
  on conflict (post_id, day) do update set views = public.post_views.views + 1;
$$;

revoke all on function public.record_post_view(text) from public;
grant execute on function public.record_post_view(text) to anon, authenticated;

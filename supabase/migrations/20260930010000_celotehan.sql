-- Celotehan: tulisan sebaris, pendamping cerita yang panjang.
-- Tampil di balon kerumunan di beranda dan (nanti) di halaman sendiri.

create table public.celotehan (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(btrim(body)) between 1 and 140),
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now()
);

create index celotehan_terbaru_idx on public.celotehan (created_at desc) where status = 'published';

alter table public.celotehan enable row level security;

create policy "publik membaca celotehan terbit"
  on public.celotehan for select
  to anon, authenticated
  using (status = 'published');

create policy "admin mengelola celotehan"
  on public.celotehan for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Yacuap: komentar anonim di halaman baca.
-- Langsung tampil tanpa persetujuan. Pengunjung hanya bisa menulis dan membaca; admin bisa menghapus.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "publik membaca komentar"
  on public.comments for select
  to anon, authenticated
  using (true);

-- hanya ke tulisan yang terbit (RLS posts ikut berlaku di subquery)
create policy "publik menulis komentar"
  on public.comments for insert
  to anon, authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id));

create policy "admin menghapus komentar"
  on public.comments for delete
  to authenticated
  using (public.is_admin());

-- Yacuap, Phase 0: fondasi.
-- Admin, tulisan, tag, RLS, dan bucket gambar. Lihat docs/PRD.md bagian 5.

-- ---------------------------------------------------------------------------
-- Tipe
-- ---------------------------------------------------------------------------
create type public.post_category as enum ('musik', 'pikiran', 'absurd');
create type public.publish_status as enum ('draft', 'published');

-- ---------------------------------------------------------------------------
-- Admin
-- Penulisnya satu orang. Siapa pun yang punya akun Auth belum tentu admin:
-- hanya user_id yang terdaftar di tabel ini yang boleh menulis.
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admin melihat daftar admin"
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tulisan
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique,
  excerpt text not null default '',
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_html text not null default '',
  cover_path text,
  category public.post_category not null,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  reading_time integer not null default 1 check (reading_time >= 1),
  pull_quote text,
  share_paragraphs jsonb not null default '[]'::jsonb,
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint posts_published_has_date check (status = 'draft' or published_at is not null)
);

create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create index posts_category_idx on public.posts (category, published_at desc) where status = 'published';

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "publik membaca tulisan terbit"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "admin mengelola tulisan"
  on public.posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Tag
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

alter table public.tags enable row level security;

create policy "publik membaca tag"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "admin mengelola tag"
  on public.tags for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tags_tag_idx on public.post_tags (tag_id);

alter table public.post_tags enable row level security;

-- relasi tag hanya terlihat kalau tulisannya terlihat (RLS posts ikut berlaku di subquery)
create policy "publik membaca tag tulisan terbit"
  on public.post_tags for select
  to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy "admin mengelola tag tulisan"
  on public.post_tags for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- covers: publik, hanya berisi gambar yang SUDAH dimonokromkan oleh server.
-- originals: privat, cadangan file asli berwarna.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 10485760, array['image/webp', 'image/png', 'image/jpeg']),
  ('originals', 'originals', false, 26214400, array['image/webp', 'image/png', 'image/jpeg', 'image/heic', 'image/avif'])
on conflict (id) do nothing;

create policy "admin mengelola gambar"
  on storage.objects for all
  to authenticated
  using (bucket_id in ('covers', 'originals') and public.is_admin())
  with check (bucket_id in ('covers', 'originals') and public.is_admin());

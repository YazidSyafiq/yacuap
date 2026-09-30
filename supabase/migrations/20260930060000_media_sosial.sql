-- Yacuap: media sosial penulis untuk footer.
-- Profil tetap privat; yang boleh dilihat pengunjung hanya nama akun dan tautan media sosialnya,
-- lewat fungsi di bawah ini (bukan lewat akses langsung ke tabel profiles).

alter table public.profiles
  add column instagram_username text not null default '',
  add column tiktok_username text not null default '';

create or replace function public.site_socials()
returns table (
  instagram_username text,
  instagram_url text,
  tiktok_username text,
  tiktok_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.instagram_username, p.instagram_url, p.tiktok_username, p.tiktok_url
  from public.profiles p
  join public.admins a on a.user_id = p.user_id
  order by p.created_at
  limit 1;
$$;

revoke all on function public.site_socials() from public;
grant execute on function public.site_socials() to anon, authenticated;

-- Yacuap: media sosial boleh lebih dari dua, disimpan sebagai daftar.
-- Tiap butir: {"platform": "instagram", "username": "namaakun", "url": "https://..."}.

alter table public.profiles
  add column socials jsonb not null default '[]'::jsonb,
  drop column instagram_username,
  drop column instagram_url,
  drop column tiktok_username,
  drop column tiktok_url;

drop function public.site_socials();

create or replace function public.site_socials()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.socials from public.profiles p join public.admins a on a.user_id = p.user_id order by p.created_at limit 1),
    '[]'::jsonb
  );
$$;

revoke all on function public.site_socials() from public;
grant execute on function public.site_socials() to anon, authenticated;

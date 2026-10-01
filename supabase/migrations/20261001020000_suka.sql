-- Yacuap: tombol Suka di tulisan.
-- Tanpa akun: tiap browser punya penanda acak (uuid) sendiri, satu suka per penanda per tulisan.
-- Pengunjung tidak bisa membaca atau mengubah tabelnya langsung; semuanya lewat fungsi di bawah.
-- Membaca baris-barisnya (untuk dashboard) hanya admin.

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  visitor uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, visitor)
);

create index post_likes_created_at_idx on public.post_likes (created_at);

alter table public.post_likes enable row level security;

create policy "admin membaca suka"
  on public.post_likes for select
  to authenticated
  using (public.is_admin());

-- Satu fungsi untuk membaca dan mengubah:
--   set_to null  -> hanya membaca keadaan sekarang
--   set_to true  -> menyukai, false -> batal menyukai
-- Mengembalikan {"count": jumlah suka tulisan itu, "liked": apakah penanda ini menyukainya}.
create or replace function public.post_like(post_slug text, visitor_id uuid, set_to boolean default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select p.id into target from public.posts p where p.slug = post_slug and p.status = 'published';
  if target is null then
    return jsonb_build_object('count', 0, 'liked', false);
  end if;

  if set_to is true then
    insert into public.post_likes (post_id, visitor) values (target, visitor_id) on conflict do nothing;
  elsif set_to is false then
    delete from public.post_likes l where l.post_id = target and l.visitor = visitor_id;
  end if;

  return jsonb_build_object(
    'count', (select count(*) from public.post_likes l where l.post_id = target),
    'liked', exists (select 1 from public.post_likes l where l.post_id = target and l.visitor = visitor_id)
  );
end;
$$;

revoke all on function public.post_like(text, uuid, boolean) from public;
grant execute on function public.post_like(text, uuid, boolean) to anon, authenticated;

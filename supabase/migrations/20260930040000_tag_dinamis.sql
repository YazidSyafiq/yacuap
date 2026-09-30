-- Yacuap: tag dinamis.
-- Sebelumnya tulisan punya satu kategori tetap (musik, pikiran, absurd) berupa enum.
-- Sekarang kategori dilebur ke tabel `tags`: bisa ditambah kapan saja dari admin,
-- dan satu tulisan boleh punya lebih dari satu tag (lewat `post_tags`).

alter table public.tags
  add column description text not null default '',
  add column position integer not null default 0;

create index tags_urutan_idx on public.tags (position, name);

drop index if exists public.posts_category_idx;
alter table public.posts drop column category;
drop type public.post_category;

-- tiga tag awal, sama dengan kategori yang lama
insert into public.tags (name, slug, description, position)
values
  ('Musik', 'musik', 'Lagu, album, dan apa aja yang nempel di kuping.', 0),
  ('Pikiran', 'pikiran', 'Isi kepala, ditulis dulu sebelum keburu lupa.', 1),
  ('Absurd', 'absurd', 'Nggak perlu masuk akal, yang penting ditulis.', 2)
on conflict (slug) do nothing;

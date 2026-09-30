-- Yacuap: profil penulis (halaman Akun saya di admin).
-- Isinya data diri, sebagian bersifat pribadi (alamat, tanggal lahir, nomor telepon),
-- jadi hanya bisa dibaca dan diubah oleh pemilik akunnya sendiri. Tidak ada akses publik.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  nickname text not null default '',
  role_label text not null default '',
  bio text not null default '' check (char_length(bio) <= 280),
  phone text not null default '',
  city text not null default '',
  birth_place text not null default '',
  birth_date date,
  gender text check (gender in ('laki-laki', 'perempuan')),
  education text not null default '',
  address text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "admin mengelola profilnya sendiri"
  on public.profiles for all
  to authenticated
  using (public.is_admin() and user_id = (select auth.uid()))
  with check (public.is_admin() and user_id = (select auth.uid()));

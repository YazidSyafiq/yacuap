# Yacuap

Website pribadi Yazid Syafiq Irsyad: cerita soal musik, pikiran, dan hal-hal absurd, plus playlist. Dokumen produk dan rencana lengkap ada di [docs/PRD.md](docs/PRD.md).

Dibangun dengan Next.js 16 (App Router, Turbopack), Tailwind CSS 4, dan Supabase.

## Menjalankan di lokal

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run dev
```

Buka http://localhost:3000. Halaman publik jalan tanpa Supabase. Area `/admin` butuh Supabase.

## Menyiapkan Supabase

1. Buat project di https://supabase.com, lalu salin Project URL dan publishable key ke `.env.local`.
2. Terapkan skema:

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-project>
   npm run db:push
   ```

3. Di dashboard Supabase, buka Authentication, matikan pendaftaran mandiri (Allow new users to sign up), lalu buat satu user untuk kamu (Add user, email dan kata sandi).
4. Daftarkan user itu sebagai admin. Jalankan di SQL Editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-kamu@contoh.com';
   ```

5. Masuk lewat `/admin/login`.

### Satu Supabase untuk semuanya

Project Supabase yang sama dipakai di laptop dan di produksi. Artinya:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sama persis di `.env.local` dan di Vercel. Yang beda hanya `NEXT_PUBLIC_SITE_URL`.
- Apa pun yang ditulis atau dihapus dari laptop langsung tampil di situs yang sudah terbit. Tidak ada data percobaan yang terpisah.
- `npm run db:push` langsung mengubah database produksi. Baca dulu isi migration-nya sebelum dijalankan, dan jangan pernah mengedit migration yang sudah pernah di-push: buat file migration baru.
- Simpan tulisan percobaan sebagai draf, jangan diterbitkan.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan produksi |
| `npm run lint` / `npm run typecheck` | Pemeriksaan kode |
| `npm run db:push` | Terapkan migration ke project Supabase yang ter-link |
| `npm run db:reset` | Ulangi semua migration di database lokal |
| `npm run db:types` | Buat ulang tipe TypeScript dari skema lokal |

## Struktur

```
app/(public)/      halaman publik: beranda, kategori, playlist, tentang
app/admin/         login dan panel admin
components/        komponen UI dasar dan kerangka situs
lib/               konfigurasi situs, kategori, klien Supabase, penjaga admin
proxy.ts           menjaga /admin dan menyegarkan sesi (pengganti middleware di Next.js 16)
supabase/          konfigurasi lokal dan migration
docs/              PRD dan aset logo
```

## Deploy

Vercel, terhubung ke repo GitHub. Set tiga env dari `.env.example` di Project Settings. Saat pindah ke domain sendiri, cukup ganti `NEXT_PUBLIC_SITE_URL`.

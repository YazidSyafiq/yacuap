-- Ocehan awal (seratus kalimat contoh dari 20260930020000_ocehan_awal.sql) tidak dipakai lagi:
-- penulis mengisi ocehannya sendiri dari admin, tanpa data contoh. Di produksi tabel sudah dikosongkan
-- manual pada 10 Oktober 2026; migration ini memastikan database baru yang memutar ulang semua migration
-- juga berakhir kosong. Saat migration ini dijalankan, satu-satunya isi tabel adalah ocehan awal itu.

delete from public.celotehan;

-- Pergantian minggu chart jadi otomatis (keputusan 11 Oktober 2026): penulis hanya mengatur lagunya.
-- Fungsi ini aman dipanggil kapan saja dan oleh siapa saja: hanya bekerja kalau rentang minggu chart sudah lewat
-- (atau belum pernah diisi), dan hasilnya sama persis dengan yang akan terjadi sendiri seiring waktu.
-- Minggu mengikuti kalender, Senin sampai Minggu, zona Asia/Jakarta.

create or replace function public.chart_rollover()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
  monday date := (date_trunc('week', (now() at time zone 'Asia/Jakarta')::date))::date;
  current_to date;
begin
  select chart_to into current_to from public.chart where id;
  if current_to is not null and current_to >= today then
    return false;
  end if;

  -- rentang yang pernah terisi dan sudah lewat: posisi sekarang jadi posisi minggu lalu, lama bertahan bertambah
  if current_to is not null then
    update public.chart_tracks set last_position = position, weeks_on_chart = weeks_on_chart + 1;
  end if;

  update public.chart set chart_from = monday, chart_to = monday + 6 where id;
  return true;
end;
$$;

revoke all on function public.chart_rollover() from public;
grant execute on function public.chart_rollover() to anon, authenticated;

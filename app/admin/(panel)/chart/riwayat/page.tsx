import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LastWeekCell, MovementBadge, TrackNote } from "@/components/player/track-list";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { CHART_SIZE, chartWeekLabel, isoWeek } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { coverUrl } from "@/lib/playlist";
import { tableHead } from "../../playlist/forms";

export const metadata: Metadata = { title: "Riwayat Chart" };

type HistoryRow = {
  chart_from: string;
  chart_to: string;
  position: number;
  title: string;
  artist: string;
  note: string;
  last_position: number | null;
  weeks_on_chart: number;
  tracks: { artwork_path: string | null } | null;
};
type Week = { from: string; to: string; number: number | null; label: string; rows: HistoryRow[] };

/**
 * Riwayat chart: tiap minggu yang sudah lewat tersimpan utuh di arsip (posisi, lagu, catatan, gerak, lama bertahan saat itu).
 * Daftar minggunya di kiri, isi minggu yang dipilih (?minggu=YYYY-MM-DD) di kanan, susunannya sama dengan editor chart tapi hanya dibaca.
 */
export default async function ChartHistoryPage({ searchParams }: PageProps<"/admin/chart/riwayat">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data } = await supabase
    .from("chart_history")
    .select("chart_from, chart_to, position, title, artist, note, last_position, weeks_on_chart, tracks(artwork_path)")
    .order("chart_from", { ascending: false })
    .order("position", { ascending: true });
  const rows = (data ?? []) as unknown as HistoryRow[];

  const weeks: Week[] = [];
  for (const row of rows) {
    const last = weeks.at(-1);
    if (last && last.from === row.chart_from) last.rows.push(row);
    else weeks.push({ from: row.chart_from, to: row.chart_to, number: isoWeek(row.chart_from), label: chartWeekLabel(row.chart_from, row.chart_to), rows: [row] });
  }
  const wanted = typeof params.minggu === "string" ? params.minggu : null;
  const selected = weeks.find((week) => week.from === wanted) ?? weeks[0];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Riwayat Chart"
        note="Tiap Senin, chart minggu yang baru lewat masuk arsip apa adanya. Yang tersimpan tidak diubah lagi dari sini."
        action={
          <Link href="/admin/chart" className={buttonClass("secondary", "md", undefined, "sm")}>
            Chart Minggu Ini
          </Link>
        }
      />

      {weeks.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface px-5 py-8">
          <p className="font-display text-2xl italic">Arsipnya masih kosong.</p>
          <p className="text-[15px] text-muted">Minggu yang sedang jalan masuk arsip Senin depan, begitu minggunya maju sendiri. Setelah itu tiap minggu bertambah satu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* daftar minggu: pil mendatar yang bisa digulir di HP, daftar tegak di laptop */}
          <nav aria-label="Minggu yang diarsipkan" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {weeks.map((week) => {
              const active = week.from === selected?.from;
              return (
                <Link
                  key={week.from}
                  href={week.from === weeks[0].from ? "/admin/chart/riwayat" : `/admin/chart/riwayat?minggu=${week.from}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 flex-col gap-0.5 rounded-2xl border px-4 py-3 transition-colors lg:shrink",
                    active ? "border-ink bg-ink text-bg" : "border-line bg-surface hover:border-ink",
                  )}
                >
                  <span className="font-ui text-[15px] font-semibold leading-snug">{week.number ? `Minggu ke-${week.number}` : "Minggu"}</span>
                  <span className={cn("whitespace-nowrap font-ui text-[12px]", active ? "text-bg/70" : "text-muted")}>
                    {week.label}, {week.rows.length} lagu
                  </span>
                </Link>
              );
            })}
          </nav>

          {selected ? <WeekTable week={selected} /> : null}
        </div>
      )}
    </div>
  );
}

/** Isi satu minggu arsip, hanya dibaca: kartu per lagu di HP, tabel di laptop, sama seperti editor chart tanpa tombol. */
function WeekTable({ week }: { week: Week }) {
  const columns = "sm:[grid-template-columns:72px_64px_minmax(0,1fr)_144px_120px] sm:gap-x-6";
  const top = week.rows[0];
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-medium leading-tight">{week.number ? `Minggu ke-${week.number}` : "Minggu"}</h2>
        <p className="font-ui text-[14px] text-muted">
          {week.label}, {week.rows.length} dari {CHART_SIZE} lagu{top ? `, nomor satu ${top.title}` : ""}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className={cn("hidden items-center gap-3 border-b border-line px-4 py-3 sm:grid", columns)}>
          <span className={tableHead}>Posisi</span>
          <span />
          <span className={tableHead}>Lagu</span>
          <span className={cn(tableHead, "text-center sm:pl-2")}>Minggu lalu</span>
          <span className={cn(tableHead, "text-right")}>Bertahan</span>
        </div>
        <ol className="flex flex-col">
          {week.rows.map((row) => {
            const artwork = coverUrl(row.tracks?.artwork_path);
            const weeksText = row.last_position == null || row.weeks_on_chart <= 1 ? "baru masuk" : `bertahan ${row.weeks_on_chart} minggu`;
            const art = (size: number) => (
              <span className="relative shrink-0 overflow-hidden rounded-lg bg-(--cover)" style={{ width: size, height: size }}>
                {artwork ? <Image src={artwork} alt="" fill sizes={`${size}px`} unoptimized className="mono-img object-cover" /> : null}
              </span>
            );
            return (
              <li key={row.position} className="border-b border-line last:border-b-0">
                <div className="flex flex-col gap-3.5 px-4 py-5 sm:hidden">
                  <div className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-center font-display text-[2rem] font-semibold tabular-nums leading-none tracking-[-0.02em]">{row.position}</span>
                    {art(56)}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="font-ui text-[16px] font-semibold leading-[1.3]">{row.title}</p>
                      <p className="font-ui text-[13px] text-muted">{row.artist || "Artis belum diisi"}</p>
                    </div>
                  </div>
                  {row.note ? <TrackNote note={row.note} quote /> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <MovementBadge position={row.position} lastPosition={row.last_position} />
                    <span className="font-ui text-xs font-medium text-muted">{row.last_position == null ? "baru masuk minggu itu" : `minggu sebelumnya di ${row.last_position}, ${weeksText}`}</span>
                  </div>
                </div>
                <div className={cn("hidden items-start gap-3 px-4 py-4 sm:grid", columns)}>
                  <span className="flex h-16 w-9 items-center justify-center font-display text-[1.75rem] font-medium tabular-nums leading-none">{row.position}</span>
                  {art(64)}
                  <div className={cn("flex min-w-0 max-w-[560px] flex-col gap-0.5", row.note ? "pt-0.5" : "min-h-16 justify-center")}>
                    <p className="truncate font-ui text-[16px] font-semibold leading-snug">{row.title}</p>
                    <p className="truncate font-ui text-[13px] text-muted">{row.artist || "Artis belum diisi"}</p>
                    {row.note ? <TrackNote note={row.note} compact muted /> : null}
                  </div>
                  <LastWeekCell position={row.position} lastPosition={row.last_position} className="h-16 pl-2" />
                  <span className="flex h-16 items-center justify-end font-ui text-[13px] text-muted">{weeksText}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

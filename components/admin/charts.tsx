"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

const number = new Intl.NumberFormat("id-ID");

/** Variabel CSS --i untuk jeda animasi berurutan. */
function order(i: number, extra?: CSSProperties): CSSProperties {
  return { "--i": i, ...extra } as CSSProperties;
}

/**
 * Pembungkus diagram: menandai `data-visible` saat diagramnya masuk layar, yang memicu animasi tumbuh di CSS.
 * Atributnya dipasang langsung ke elemen (bukan lewat state), jadi tidak ada render ulang.
 */
export function ChartReveal({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.setAttribute("data-visible", "");
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("chart-anim", className)}>
      {children}
    </div>
  );
}

export type ColumnDatum = { key: string; label: string; longLabel: string; values: number[]; /** Rincian tambahan di keterangan sorotan. */ detail?: string };

// Seri dibedakan lewat gelap-terang tinta (situsnya monokrom): seri pertama paling pekat dan paling bawah.
const SERIES_SHADES = [1, 0.38, 0.2];

/** Batas atas sumbu yang "bulat" (1, 2, 5, 10, 20, 50, ...), supaya garis bantunya jatuh di angka yang enak dibaca. */
function niceMax(value: number) {
  if (value <= 4) return Math.max(2, value % 2 === 0 ? value : value + 1);
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10].map((step) => step * power).find((candidate) => candidate >= value) ?? value;
}

/**
 * Diagram kolom dengan garis bantu dan sumbu angka di kiri. Kolomnya ramping (lebar dibatasi) dengan sudut atas membulat.
 * Bisa bertumpuk: tiap butir punya beberapa nilai, satu per seri, dan legendanya tampil di atas diagram.
 * Kolom tumbuh dari bawah saat masuk layar; kolom yang disorot (kursor, fokus, ketukan) tetap pekat, yang lain meredup,
 * dan rinciannya muncul di pojok.
 */
export function ColumnChart({
  data,
  series,
  unit,
  empty,
  labelEvery = 1,
  max,
}: {
  data: ColumnDatum[];
  /** Nama tiap seri, urut dari yang paling bawah. Satu nama berarti diagram biasa tanpa legenda. */
  series: string[];
  unit: string;
  empty: string;
  /** Label sumbu bawah ditampilkan tiap berapa kolom (kolom terakhir selalu diberi label). */
  labelEvery?: number;
  /** Batas atas sumbu yang dipaksa, misalnya 7 untuk "hari dalam seminggu". */
  max?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const totals = data.map((item) => item.values.reduce((sum, value) => sum + value, 0));
  const grand = totals.reduce((sum, value) => sum + value, 0);
  const top = max ?? niceMax(Math.max(1, ...totals));
  const ticks = top % 2 === 0 ? [top, top / 2, 0] : [top, 0];
  // sumbu ganjil (misalnya 7) hanya diberi garis atas dan bawah
  const stacked = series.length > 1;

  if (grand === 0) {
    return <p className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border-strong px-4 text-center text-sm text-muted">{empty}</p>;
  }

  return (
    <ChartReveal className="relative flex flex-col gap-3">
      {stacked ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {series.map((name, i) => (
            <li key={name} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px] bg-ink" style={{ opacity: SERIES_SHADES[i % SERIES_SHADES.length] }} />
              {name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        {/* sumbu angka */}
        <div className="flex h-44 w-5 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-muted">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {number.format(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* garis bantu */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-44 flex-col justify-between">
            {ticks.map((tick) => (
              <span key={tick} className={cn("block border-t", tick === 0 ? "border-border-strong" : "border-dashed border-line")} />
            ))}
          </div>

          <div className="relative flex h-44 items-end" onMouseLeave={() => setActive(null)}>
            {data.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((current) => (current === i ? null : i))}
                aria-label={`${item.longLabel}: ${series.map((name, j) => `${number.format(item.values[j] ?? 0)} ${stacked ? name : unit}`).join(", ")}`}
                className="no-focus-ring flex h-full min-w-0 flex-1 cursor-default items-end justify-center px-[3px] sm:px-1.5"
              >
                {totals[i] > 0 ? (
                  <span className="grow-y flex w-full max-w-11 flex-col-reverse overflow-hidden rounded-t-md" style={order(i, { height: `${Math.max(3, (totals[i] / top) * 100)}%` })}>
                    {item.values.map((value, j) =>
                      value > 0 ? (
                        <span
                          key={series[j] ?? j}
                          className="block w-full bg-ink transition-opacity duration-150"
                          style={{
                            flexGrow: value,
                            flexBasis: 0,
                            // seri yang nilainya jauh lebih kecil tetap terlihat sebagai garis tipis
                            minHeight: stacked ? 3 : undefined,
                            opacity: (active !== null && active !== i ? 0.3 : 1) * SERIES_SHADES[j % SERIES_SHADES.length],
                          }}
                        />
                      ) : null,
                    )}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* label sumbu bawah */}
          <div className="flex pt-2">
            {data.map((item, i) => (
              <span
                key={item.key}
                className={cn("min-w-0 flex-1 truncate text-center text-[10px] tabular-nums", active === i ? "font-semibold text-ink" : "text-muted")}
              >
                {i % labelEvery === (data.length - 1) % labelEvery || active === i ? item.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {active !== null ? (
        <p className="pointer-events-none absolute right-0 top-0 z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-md">
          <span className="block text-muted">{data[active].longLabel}</span>
          {stacked ? (
            series.map((name, j) => (
              <span key={name} className="block font-semibold">
                {number.format(data[active].values[j] ?? 0)} {name.toLowerCase()}
              </span>
            ))
          ) : (
            <span className="block font-semibold">
              {number.format(totals[active])} {unit}
            </span>
          )}
          {data[active].detail ? <span className="block text-muted">{data[active].detail}</span> : null}
        </p>
      ) : null}
    </ChartReveal>
  );
}

export type BarDatum = { key: string; label: string; value: number; href?: string };

/** Batang mendatar. Batang memanjang saat masuk layar; baris yang disorot menonjol, menampilkan persentasenya, dan yang lain meredup. */
export function BarList({ data, empty }: { data: BarDatum[]; empty: string }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((item) => item.value));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) return <p className="py-2 text-sm text-muted">{empty}</p>;

  return (
    <ChartReveal>
      <ul className="flex flex-col gap-1" onMouseLeave={() => setActive(null)}>
        {data.map((item, i) => {
          const highlighted = active === item.key;
          return (
            <li
              key={item.key}
              onMouseEnter={() => setActive(item.key)}
              className={cn(
                "-mx-2 grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-[background-color,opacity] duration-200",
                highlighted && "bg-bg",
                active !== null && !highlighted && "opacity-45",
              )}
            >
              {item.href ? (
                <Link href={item.href} onFocus={() => setActive(item.key)} onBlur={() => setActive(null)} className="truncate font-medium hover:underline" title={item.label}>
                  {item.label}
                </Link>
              ) : (
                <span className="truncate font-medium" title={item.label}>
                  {item.label}
                </span>
              )}
              <span className="h-2.5 rounded-r-full bg-bg">
                <span className="grow-x block h-full" style={order(i, { width: `${item.value > 0 ? Math.max(4, (item.value / max) * 100) : 0}%` })}>
                  <span className={cn("block h-full rounded-r-full bg-ink transition-transform duration-200", highlighted && "scale-y-125")} />
                </span>
              </span>
              <span className="w-[4.5rem] text-right tabular-nums">
                <span className="font-semibold">{number.format(item.value)}</span>
                {highlighted && total > 0 ? <span className="ml-1.5 text-xs font-semibold text-muted">{Math.round((item.value / total) * 100)}%</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartReveal>
  );
}

export type DonutDatum = { key: string; label: string; value: number };

// Situsnya monokrom, jadi irisan dibedakan lewat gelap-terang tinta, bukan warna.
const SHADES = [1, 0.62, 0.36, 0.2, 0.82, 0.48, 0.28, 0.12];

/**
 * Diagram donat. Tiap irisan menyapu dari nol saat masuk layar. Irisan atau baris legenda yang disorot menebal,
 * yang lain meredup, dan angka di tengah berganti ke nilai irisan itu.
 */
export function DonutChart({ data, centerLabel, empty }: { data: DonutDatum[]; centerLabel: string; empty: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) return <p className="py-2 text-sm text-muted">{empty}</p>;

  // keliling lingkaran dibuat 100 (jari-jari 15,915), jadi panjang irisan sama dengan persentasenya
  const segments = data.reduce<{ item: DonutDatum; share: number; start: number; shade: number }[]>((list, item, i) => {
    const start = list.length > 0 ? list[list.length - 1].start + list[list.length - 1].share : 0;
    return [...list, { item, share: (item.value / total) * 100, start, shade: SHADES[i % SHADES.length] }];
  }, []);
  const focused = segments.find((segment) => segment.item.key === active);

  return (
    <ChartReveal className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 42 42" className="size-full -rotate-90" role="img" aria-label={`${centerLabel}: ${data.map((item) => `${item.label} ${item.value}`).join(", ")}`}>
          <circle cx="21" cy="21" r="15.915" fill="none" strokeWidth="5" className="stroke-bg" />
          {segments.map((segment, i) =>
            segment.share > 0 ? (
              <circle
                key={segment.item.key}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                strokeWidth={active === segment.item.key ? 6.4 : 5}
                strokeDashoffset={-segment.start}
                onMouseEnter={() => setActive(segment.item.key)}
                onMouseLeave={() => setActive(null)}
                className="sweep stroke-ink transition-[stroke-width,opacity] duration-200"
                // sela kecil antar irisan supaya batasnya terlihat
                style={order(i, { "--dash": Math.max(0.5, segment.share - 0.8), opacity: active !== null && active !== segment.item.key ? segment.shade * 0.35 : segment.shade } as CSSProperties)}
              />
            ) : null,
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-[1.75rem] font-semibold leading-none tabular-nums">{number.format(focused ? focused.item.value : total)}</span>
          <span className="mt-1 max-w-[5.5rem] truncate text-[11px] text-muted">{focused ? focused.item.label : centerLabel}</span>
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-0.5" onMouseLeave={() => setActive(null)}>
        {segments.map((segment, i) => (
          <li
            key={segment.item.key}
            onMouseEnter={() => setActive(segment.item.key)}
            className={cn(
              "fade-up -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-[background-color,opacity] duration-200",
              active === segment.item.key && "bg-bg",
              active !== null && active !== segment.item.key && "opacity-45",
            )}
            style={order(i)}
          >
            <span className="size-2.5 shrink-0 rounded-full bg-ink" style={{ opacity: segment.shade }} />
            <span className="min-w-0 flex-1 truncate font-medium">{segment.item.label}</span>
            <span className="font-semibold tabular-nums">{number.format(segment.item.value)}</span>
            <span className="w-9 text-right text-xs tabular-nums text-muted">{Math.round(segment.share)}%</span>
          </li>
        ))}
      </ul>
    </ChartReveal>
  );
}

export type StripDay = { key: string; label: string; active: boolean; detail: string };

/**
 * Garis waktu aktivitas: satu baris garis tipis, satu garis per hari, dikelompokkan per minggu.
 * Hari yang aktif digambar tinggi dan pekat, hari kosong pendek dan pucat, jadi polanya terbaca seperti barcode.
 * Garis yang disorot menampilkan tanggal dan apa yang dibuat hari itu.
 */
export function ActivityStrip({
  weeks,
  hint,
  labelEvery = 3,
}: {
  /** Kelompok garis (minggu, atau bulan untuk rentang panjang); tiap garis satu hari atau satu minggu. */
  weeks: { key: string; label: string; days: StripDay[] }[];
  /** Kalimat penjelas saat tidak ada garis yang disorot. */
  hint: string;
  labelEvery?: number;
}) {
  const [active, setActive] = useState<StripDay | null>(null);

  return (
    // Mengisi seluruh tinggi kartunya: area garis melar mengikuti ruang yang ada (minimal 80px),
    // jadi tingginya selalu seimbang dengan diagram di kartu sebelah.
    <ChartReveal className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-20 flex-1 items-end gap-1.5 sm:gap-2.5" onMouseLeave={() => setActive(null)}>
        {weeks.map((week, w) => (
          <div key={week.key} className="flex min-w-0 items-end gap-px self-stretch sm:gap-[2px]" style={{ flexGrow: Math.max(1, week.days.length), flexBasis: 0 }}>
            {week.days.map((day) => (
              <button
                key={day.key}
                type="button"
                onMouseEnter={() => setActive(day)}
                onFocus={() => setActive(day)}
                onBlur={() => setActive(null)}
                onClick={() => setActive((current) => (current?.key === day.key ? null : day))}
                aria-label={`${day.label}: ${day.detail}`}
                className="no-focus-ring flex min-w-0 flex-1 cursor-default items-end self-stretch"
              >
                {day.active ? (
                  // direntangkan lewat flex (bukan tinggi persen), supaya tetap benar saat tinggi kartunya mengikuti kartu sebelah
                  <span className="grow-y flex w-full self-stretch" style={order(w)}>
                    <span
                      className={cn(
                        "block w-full flex-1 rounded-[2px] bg-ink transition-opacity duration-150",
                        active !== null && active.key !== day.key && "opacity-35",
                      )}
                    />
                  </span>
                ) : (
                  <span className={cn("block h-[28%] min-h-2 w-full rounded-[2px] bg-line", active?.key === day.key && "bg-border-strong")} />
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
      {/* label awal kelompok, tidak di semua kelompok supaya tidak sesak */}
      <div className="flex gap-1.5 sm:gap-2.5">
        {weeks.map((week, w) => (
          <span key={week.key} className="min-w-0 truncate text-[10px] tabular-nums text-muted" style={{ flexGrow: Math.max(1, week.days.length), flexBasis: 0 }}>
            {w % labelEvery === 0 ? week.label : ""}
          </span>
        ))}
      </div>
      <p className="min-h-4 text-xs text-muted">
        {active ? (
          <>
            <span className="font-semibold text-ink">{active.label}</span> · {active.detail}
          </>
        ) : (
          hint
        )}
      </p>
    </ChartReveal>
  );
}

/**
 * Grafik pembanding kecil di dalam kartu angka: dua batang mendatar, "Periode ini" (pekat) dan "Sebelumnya" (pucat,
 * yaitu periode sama panjang tepat sebelumnya),
 * panjangnya sebanding dengan nilainya. Batangnya memanjang saat kartunya masuk layar.
 */
export function MiniCompare({
  current,
  previous,
  digits = 0,
}: {
  current: number;
  previous: number;
  /** Jumlah angka di belakang koma, untuk nilai seperti rata-rata. */
  digits?: number;
}) {
  const format = new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits });
  const max = Math.max(1, current, previous);
  const rows = [
    { key: "ini", label: "Periode ini", value: current, bar: "bg-ink", text: "font-semibold text-ink" },
    // labelnya sengaja pendek dan tetap, supaya muat di kartu sesempit apa pun tanpa terpotong
    { key: "lalu", label: "Sebelumnya", value: previous, bar: "bg-border-strong", text: "text-muted" },
  ];

  return (
    <ChartReveal className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3">
      {rows.map((row, i) => (
        <div key={row.key} className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-2 text-[11px]">
          <span className="whitespace-nowrap text-muted">{row.label}</span>
          <span className="h-1.5 rounded-full bg-bg">
            <span className="grow-x block h-full" style={order(i, { width: `${row.value > 0 ? Math.max(4, (row.value / max) * 100) : 0}%` })}>
              <span className={cn("block h-full rounded-full", row.bar)} />
            </span>
          </span>
          <span className={cn("min-w-6 text-right tabular-nums", row.text)}>{format.format(row.value)}</span>
        </div>
      ))}
    </ChartReveal>
  );
}

/**
 * Kaki kartu untuk kartu angka yang tidak punya pembanding: dua baris keterangan dengan susunan dan tinggi
 * yang sama seperti MiniCompare, supaya semua kartu dalam satu baris terisi seimbang.
 */
export function MiniFacts({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="mt-auto flex flex-col gap-1.5 border-t border-line pt-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] items-center gap-2 text-[11px]">
          <span className="truncate text-muted">{row.label}</span>
          <span className="truncate text-right font-medium text-ink" title={row.value}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

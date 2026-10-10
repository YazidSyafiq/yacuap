import type { Metadata } from "next";
import Link from "next/link";
import { PlaylistShowcase } from "@/components/site/playlist-view";
import { Container, Eyebrow } from "@/components/ui/container";
import { chartWeekLabel } from "@/lib/chart";
import { CHART_SIZE } from "@/lib/chart";
import { getChart } from "@/lib/playlist";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const chart = await getChart();
  const week = chart ? chartWeekLabel(chart.chartFrom, chart.chartTo) : "";
  return {
    title: "Chart minggu ini",
    description: week ? `${CHART_SIZE} lagu yang paling sering diputar, ${week}.` : `${CHART_SIZE} lagu yang paling sering diputar seminggu belakangan.`,
  };
}

/** Chart minggu ini utuh: semua lagunya dengan gerak dari minggu lalu dan lama bertahan. */
export default async function ChartPage() {
  const chart = await getChart();

  return (
    <Container className="flex flex-col gap-10 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Link href="/playlist" className="inline-flex items-center gap-1.5 self-start font-ui text-[13px] font-semibold uppercase tracking-[0.08em] text-muted hover:text-ink">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Semua playlist
        </Link>
        <Eyebrow>Chart minggu ini</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          Lagi sering muter ini.
        </h1>
        <p className="max-w-[680px] text-xl leading-relaxed text-muted">
          {CHART_SIZE} lagu yang paling sering diputar seminggu belakangan, lengkap dengan naik turunnya. Pencet aja, langsung bunyi.
        </p>
      </header>

      {chart ? (
        <PlaylistShowcase playlist={chart} titleAs="h2" />
      ) : (
        <div className="flex flex-col gap-2 py-4">
          <p className="font-display text-2xl italic">Chart-nya belum diisi, nih.</p>
          <p className="text-[17px] text-muted">Lagi dihitung-hitung dulu mana yang paling sering diputar. Nanti nongol di sini.</p>
        </div>
      )}
    </Container>
  );
}

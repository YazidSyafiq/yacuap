import type { Metadata } from "next";
import { getTrackOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { ChartAdmin, type ChartTrack } from "./forms";

export const metadata: Metadata = { title: "Chart" };

type ChartRow = { title: string; description: string; chart_from: string | null; chart_to: string | null };
type EntryRow = { note: string; position: number; last_position: number | null; weeks_on_chart: number; tracks: { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null } | null };

/** Chart minggu ini: satu baris pengaturan dan paling banyak 20 lagu. */
export default async function AdminChartPage() {
  const { supabase } = await requireAdmin();
  // minggu yang sudah lewat langsung dimajukan sebelum datanya dibaca, jadi yang tampil selalu minggu ini
  await supabase.rpc("chart_rollover");
  const [{ data: chart }, { data: entries }, options] = await Promise.all([
    supabase.from("chart").select("title, description, chart_from, chart_to").maybeSingle(),
    supabase.from("chart_tracks").select("note, position, last_position, weeks_on_chart, tracks(id, title, artist, youtube_id, artwork_path)").order("position", { ascending: true }),
    getTrackOptions(supabase),
  ]);
  const row = (chart ?? { title: "Chart Minggu Ini", description: "", chart_from: null, chart_to: null }) as ChartRow;
  const tracks: ChartTrack[] = ((entries ?? []) as unknown as EntryRow[]).flatMap((item) =>
    item.tracks
      ? [
          {
            id: item.tracks.id,
            title: item.tracks.title,
            artist: item.tracks.artist,
            youtubeId: item.tracks.youtube_id,
            artwork: coverUrl(item.tracks.artwork_path),
            note: item.note,
            lastPosition: item.last_position,
            weeks: item.weeks_on_chart,
          },
        ]
      : [],
  );

  return <ChartAdmin chart={{ title: row.title, description: row.description, chartFrom: row.chart_from, chartTo: row.chart_to }} tracks={tracks} options={options} />;
}

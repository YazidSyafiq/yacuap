import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { OcehanManager, type Quip } from "./forms";

export const metadata: Metadata = { title: "Ocehan" };

type Row = { id: string; body: string; created_at: string };

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

/** Ocehan: kalimat sebaris (maksimal 140 karakter) yang tampil di bagian Ocehan dan balon kerumunan di beranda. */
export default async function AdminOcehanPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("celotehan").select("id, body, created_at").order("created_at", { ascending: false });
  const quips: Quip[] = ((data ?? []) as Row[]).map((row) => ({ id: row.id, body: row.body, createdAt: row.created_at }));
  // tanggal diformat di server supaya sama di mana pun pembacanya
  const dates = Object.fromEntries(quips.map((quip) => [quip.id, dateFormat.format(new Date(quip.createdAt))]));

  return <OcehanManager quips={quips} dates={dates} />;
}

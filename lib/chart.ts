/** Pembantu chart mingguan yang boleh dipakai di server maupun browser (tanpa akses data). */

/** Chart selalu berisi paling banyak sekian lagu. */
export const CHART_SIZE = 20;

export type Movement = { kind: "up" | "down" | "same" | "new"; delta: number };

/** Gerak sebuah lagu dibanding minggu lalu. `lastPosition` kosong berarti baru masuk chart. */
export function movementOf(position: number, lastPosition: number | null): Movement {
  if (lastPosition == null) return { kind: "new", delta: 0 };
  const delta = lastPosition - position;
  if (delta > 0) return { kind: "up", delta };
  if (delta < 0) return { kind: "down", delta: -delta };
  return { kind: "same", delta: 0 };
}

const monthLong = new Intl.DateTimeFormat("id-ID", { month: "long", timeZone: "UTC" });

/** "6 sampai 12 Oktober 2026", atau "28 September sampai 4 Oktober 2026" kalau lintas bulan. Kosong kalau tanggalnya belum diisi. */
export function chartWeekLabel(from: string | null, to: string | null): string {
  if (!from || !to) return "";
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  const sameMonth = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
  const left = sameMonth ? String(a.getUTCDate()) : `${a.getUTCDate()} ${monthLong.format(a)}${a.getUTCFullYear() !== b.getUTCFullYear() ? ` ${a.getUTCFullYear()}` : ""}`;
  return `${left} sampai ${b.getUTCDate()} ${monthLong.format(b)} ${b.getUTCFullYear()}`;
}

const monthShort = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });

/** Versi pendek label minggu untuk ruang sempit, misalnya "5 sampai 11 Okt 2026" atau "29 Sep sampai 5 Okt 2026". */
export function chartWeekLabelShort(from: string | null, to: string | null): string {
  if (!from || !to) return "";
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "";
  const sameMonth = a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
  const left = sameMonth ? String(a.getUTCDate()) : `${a.getUTCDate()} ${monthShort.format(a)}`;
  return `${left} sampai ${b.getUTCDate()} ${monthShort.format(b)} ${b.getUTCFullYear()}`;
}

/** Tanggal hari ini dan enam hari ke depan sebagai "YYYY-MM-DD" (zona Asia/Jakarta), untuk mengisi minggu baru. */
export function thisWeek(): { from: string; to: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
  const now = new Date();
  const from = fmt.format(now);
  const to = fmt.format(new Date(now.getTime() + 6 * 86400000));
  return { from, to };
}

/** Nomor minggu ISO dari tanggal "YYYY-MM-DD", untuk keterangan "minggu ke-41". Null kalau tanggalnya kosong. */
export function isoWeek(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start) / 86400000 + 1) / 7);
}

/**
 * Keadaan rentang minggu chart dibanding hari ini (zona Jakarta): berapa hari lagi sampai akhir minggu,
 * negatif kalau sudah lewat, null kalau tanggalnya belum diisi.
 */
export function daysLeft(to: string | null): number | null {
  if (!to) return null;
  const today = thisWeek().from;
  const a = new Date(`${today}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

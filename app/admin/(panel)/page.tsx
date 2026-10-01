import type { Metadata } from "next";
import { ActivityStrip, BarList, ColumnChart, DonutChart, MiniCompare, MiniFacts } from "@/components/admin/charts";
import { CommentIcon, EyeIcon, MusicIcon, PenIcon, QuoteIcon, TagIcon } from "@/components/admin/icons";
import { RangeFilter } from "@/components/admin/range-filter";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard" };

const ZONE = "Asia/Jakarta";
const DAY_MS = 86_400_000;
/** Hari pertama penghitung baca dipasang; kunjungan sebelum ini tidak pernah tercatat. */
const VIEWS_SINCE = "2026-10-01";

/**
 * Pilihan rentang cepat. Semua angka dan diagram di dashboard mengikuti rentang yang dipilih (?rentang=...),
 * atau rentang kustom (?dari=YYYY-MM-DD&sampai=YYYY-MM-DD).
 */
const RANGES = [
  { key: "7", label: "7 Hari" },
  { key: "30", label: "30 Hari" },
  { key: "90", label: "3 Bulan" },
  { key: "365", label: "12 Bulan" },
] as const;

/** Satu kolom diagram mewakili satu hari, tujuh hari, atau satu bulan kalender. */
type BucketKind = "day" | "week" | "month";
/** Rentang kustom paling panjang dua tahun, supaya diagramnya tetap terbaca. */
const MAX_CUSTOM_DAYS = 731;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: ZONE }).format(now));
  if (hour < 4) return "Masih melek";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

const keyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE });
/** Tanggal (YYYY-MM-DD) menurut WIB. */
const dayKey = (date: Date) => keyFormat.format(date);
/** Tanggal dari kunci hari, dipasang di tengah hari UTC supaya aman untuk hitung-hitungan hari. */
const fromKey = (key: string) => new Date(`${key}T12:00:00Z`);
/** Kunci hari yang digeser `days` hari. */
const shiftKey = (key: string, days: number) => new Date(fromKey(key).getTime() + days * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) => Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / DAY_MS);

const number = new Intl.NumberFormat("id-ID");
const longDate = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", timeZone: "UTC" });
const shortDay = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const dayDate = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" });

type ViewRow = { post_id: string; day: string; views: number };
type PostRow = {
  id: string;
  title: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  content_html: string;
  post_tags: { tag_id: string }[];
};
type CommentRow = { id: string; created_at: string; post_id: string };
type TagRow = { id: string; name: string };
type StampRow = { created_at: string };
type Bucket = { key: string; label: string; longLabel: string; start: string; end: string };

const fullDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
/** "25 September sampai 1 Oktober 2026": tahun di tanggal awal hanya ditulis kalau berbeda. */
function span(from: string, to: string) {
  const start = from.slice(0, 4) === to.slice(0, 4) ? shortDate.format(fromKey(from)) : fullDate.format(fromKey(from));
  return `${start} sampai ${fullDate.format(fromKey(to))}`;
}
const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

/** Hari pertama bulan yang `monthsBack` bulan sebelum bulan dari `key`. */
function monthStart(key: string, monthsBack: number) {
  return new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1 - monthsBack, 1, 12)).toISOString().slice(0, 10);
}

/** Rentang yang dipilih: tanggal awal, tanggal akhir, dan satuan kolom diagramnya. */
function resolveRange(params: { rentang?: unknown; dari?: unknown; sampai?: unknown }, todayKey: string) {
  const from = typeof params.dari === "string" && DATE_KEY.test(params.dari) ? params.dari : null;
  const to = typeof params.sampai === "string" && DATE_KEY.test(params.sampai) ? params.sampai : null;
  if (from && to && !Number.isNaN(fromKey(from).getTime()) && !Number.isNaN(fromKey(to).getTime())) {
    // dirapikan: urutannya dibetulkan, tidak melewati hari ini, dan tidak lebih dari dua tahun
    let endKey = from > to ? from : to;
    let startKey = from > to ? to : from;
    if (endKey > todayKey) endKey = todayKey;
    if (startKey > endKey) startKey = endKey;
    if (daysBetween(startKey, endKey) + 1 > MAX_CUSTOM_DAYS) startKey = shiftKey(endKey, -(MAX_CUSTOM_DAYS - 1));
    const length = daysBetween(startKey, endKey) + 1;
    const kind: BucketKind = length <= 31 ? "day" : length <= 120 ? "week" : "month";
    return { key: "kustom", startKey, endKey, kind };
  }
  const key = RANGES.find((item) => item.key === params.rentang)?.key ?? "30";
  if (key === "7") return { key, startKey: shiftKey(todayKey, -6), endKey: todayKey, kind: "day" as BucketKind };
  if (key === "90") return { key, startKey: shiftKey(todayKey, -90), endKey: todayKey, kind: "week" as BucketKind };
  if (key === "365") return { key, startKey: monthStart(todayKey, 11), endKey: todayKey, kind: "month" as BucketKind };
  return { key, startKey: shiftKey(todayKey, -29), endKey: todayKey, kind: "day" as BucketKind };
}

/** Kolom-kolom diagram untuk rentang `startKey` sampai `endKey`, dari yang paling lama. */
function buildBuckets(startKey: string, endKey: string, kind: BucketKind): Bucket[] {
  if (kind === "month") {
    const buckets: Bucket[] = [];
    for (let first = monthStart(startKey, 0); first <= endKey; first = monthStart(first, -1)) {
      const lastDay = shiftKey(monthStart(first, -1), -1);
      const date = fromKey(first);
      buckets.push({
        key: first,
        label: monthShort.format(date),
        longLabel: monthLong.format(date),
        start: first < startKey ? startKey : first,
        end: lastDay > endKey ? endKey : lastDay,
      });
    }
    return buckets;
  }
  if (kind === "week") {
    // jendela tujuh hari yang berakhir di tanggal akhir, mundur sampai menutup tanggal awal
    const count = Math.ceil((daysBetween(startKey, endKey) + 1) / 7);
    return Array.from({ length: count }, (_, i) => {
      const end = shiftKey(endKey, -(count - 1 - i) * 7);
      const start = [shiftKey(end, -6), startKey].sort()[1];
      return { key: start, label: shortDay.format(fromKey(start)), longLabel: `${shortDate.format(fromKey(start))} sampai ${shortDate.format(fromKey(end))}`, start, end };
    });
  }
  return Array.from({ length: daysBetween(startKey, endKey) + 1 }, (_, i) => {
    const key = shiftKey(startKey, i);
    return { key, label: String(Number(key.slice(8))), longLabel: dayDate.format(fromKey(key)), start: key, end: key };
  });
}

/** Kartu angka. `children` untuk grafik pembanding kecil di kaki kartu (opsional). */
function StatCard({ label, value, note, icon: Icon, children }: { label: string; value: string; note: string; icon: typeof EyeIcon; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="size-[18px] shrink-0 text-muted" />
      </div>
      <p className="font-display text-[1.75rem] font-semibold leading-none tabular-nums sm:text-[2rem]">{value}</p>
      <p className={children ? "pb-1 text-xs text-muted" : "text-xs text-muted"}>{note}</p>
      {children}
    </Card>
  );
}

function SectionCard({ title, note, icon: Icon, children }: { title: string; note?: string; icon: typeof EyeIcon; children: React.ReactNode }) {
  return (
    <Card className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          <Icon className="size-[18px] text-muted" />
          {title}
        </h2>
        {note ? <p className="text-xs text-muted">{note}</p> : null}
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">{children}</div>
    </Card>
  );
}

/** Judul kelompok, dengan garis pemisah tipis di atasnya. Rentangnya sudah tertulis di bawah filter, jadi tidak diulang di sini. */
function GroupTitle({ title }: { title: string }) {
  return <h2 className="mt-3 border-t border-line pt-5 font-display text-xl font-medium">{title}</h2>;
}

/** Dashboard: murni statistik, dua kelompok (seberapa produktif, seberapa dibaca), semuanya mengikuti rentang yang dipilih. */
export default async function AdminHomePage({ searchParams }: PageProps<"/admin">) {

  const { supabase } = await requireAdmin();
  const now = new Date();
  const todayKey = dayKey(now);
  const { key: rangeKey, startKey, endKey, kind } = resolveRange(await searchParams, todayKey);
  const buckets = buildBuckets(startKey, endKey, kind);
  const lengthDays = daysBetween(startKey, endKey) + 1;
  // dipakai di keterangan kartu dan pesan kosong: "30 hari terakhir", atau "rentang ini" untuk rentang kustom
  const phrase =
    rangeKey === "7" ? "7 hari terakhir" : rangeKey === "30" ? "30 hari terakhir" : rangeKey === "90" ? "3 bulan terakhir" : rangeKey === "365" ? "12 bulan terakhir" : "rentang ini";
  // Periode sebelumnya, untuk grafik pembanding kecil di kartu angka: sama panjang, berakhir tepat sebelum rentang ini.
  const previousEnd = shiftKey(startKey, -1);
  const previousStart = shiftKey(startKey, -lengthDays);
  const before = (key: string) => key >= previousStart && key <= previousEnd;
  const inRange = (key: string, from = startKey, to = endKey) => key >= from && key <= to;
  const stampKey = (stamp: string) => dayKey(new Date(stamp));

  const [viewsResult, postsResult, commentsResult, tagsResult, tracksResult, quipsResult] = await Promise.all([
    // termasuk periode sebelumnya, untuk grafik pembanding di kartu
    supabase.from("post_views").select("post_id, day, views").gte("day", previousStart).lte("day", endKey),
    supabase.from("posts").select("id, title, status, published_at, created_at, content_html, post_tags(tag_id)"),
    supabase.from("comments").select("id, created_at, post_id").order("created_at", { ascending: false }).limit(2000),
    supabase.from("tags").select("id, name").order("position", { ascending: true }),
    supabase.from("tracks").select("created_at"),
    supabase.from("celotehan").select("created_at").limit(5000),
  ]);
  const viewsWide = (viewsResult.data ?? []) as ViewRow[];
  const views = viewsWide.filter((row) => row.day >= startKey);
  const posts = (postsResult.data ?? []) as unknown as PostRow[];
  const allComments = (commentsResult.data ?? []) as CommentRow[];
  const tags = (tagsResult.data ?? []) as TagRow[];
  const allTracks = (tracksResult.data ?? []) as StampRow[];
  const allQuips = (quipsResult.data ?? []) as StampRow[];
  const postById = new Map(posts.map((post) => [post.id, post]));

  /* ------------------------------ produktivitas ------------------------------ */
  const publishedAll = posts.filter((post) => post.status === "published" && post.published_at);
  const drafts = posts.length - publishedAll.length;
  const publishedKeys = publishedAll.map((post) => ({ post, key: stampKey(post.published_at as string) }));
  const published = publishedKeys.filter(({ key }) => inRange(key));
  const quipKeys = allQuips.map((quip) => stampKey(quip.created_at));
  const quips = quipKeys.filter((key) => inRange(key));
  const trackKeys = allTracks.map((track) => stampKey(track.created_at));
  const tracks = trackKeys.filter((key) => inRange(key));
  // draf tertua (menurut tanggal dibuat) dan jumlah kata yang masih tersimpan di semua draf
  const draftPosts = posts.filter((post) => post.status === "draft").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const oldestDraft = draftPosts[0];
  const draftWords = draftPosts.reduce((sum, post) => sum + words(post.content_html), 0);

  const publishedBefore = publishedKeys.filter(({ key }) => before(key));
  const wordsBefore = publishedBefore.reduce((sum, { post }) => sum + words(post.content_html), 0);
  const quipsBefore = quipKeys.filter(before).length;
  const tracksBefore = trackKeys.filter(before).length;
  const rangeWords = published.reduce((sum, { post }) => sum + words(post.content_html), 0);
  const averageWords = published.length > 0 ? Math.round(rangeWords / published.length) : 0;

  const lastPost = [...publishedKeys].sort((a, b) => (a.post.published_at as string).localeCompare(b.post.published_at as string)).at(-1);
  const lastPublished = lastPost?.key;
  const daysSince = lastPublished ? daysBetween(lastPublished, todayKey) : null;

  // diagram bertumpuk: tulisan di bawah, ocehan di atas
  const made = buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    longLabel: bucket.longLabel,
    values: [
      published.filter(({ key }) => inRange(key, bucket.start, bucket.end)).length,
      quips.filter((key) => inRange(key, bucket.start, bucket.end)).length,
    ],
  }));

  // garis waktu: hari mana saja yang ada sesuatu dibuat
  const madeOn = new Map<string, [number, number, number]>();
  const mark = (key: string, kind: 0 | 1 | 2) => {
    const entry = madeOn.get(key) ?? [0, 0, 0];
    entry[kind] += 1;
    madeOn.set(key, entry);
  };
  published.forEach(({ key }) => mark(key, 0));
  quips.forEach((key) => mark(key, 1));
  tracks.forEach((key) => mark(key, 2));
  const describe = (entry: [number, number, number]) =>
    entry[0] + entry[1] + entry[2] === 0
      ? "Nggak bikin apa-apa"
      : [
          [entry[0], "tulisan"],
          [entry[1], "ocehan"],
          [entry[2], "lagu"],
        ]
          .flatMap(([value, name]) => (Number(value) > 0 ? [`${number.format(Number(value))} ${name}`] : []))
          .join(", ");
  const sumRange = (from: string, to: string) => {
    const total: [number, number, number] = [0, 0, 0];
    for (const [key, entry] of madeOn) {
      if (inRange(key, from, to)) entry.forEach((value, i) => (total[i] += value));
    }
    return total;
  };

  // Rentang 12 bulan: satu garis per minggu (dikelompokkan per bulan), supaya garisnya tidak ratusan.
  // Rentang lain: satu garis per hari, dikelompokkan per minggu (Senin sampai Minggu).
  const byWeek = kind === "month";
  const allDays = Array.from({ length: lengthDays }, (_, i) => shiftKey(startKey, i));
  const strip = byWeek
    ? buckets.map((bucket) => {
        const weekStarts = allDays.filter((key) => inRange(key, bucket.start, bucket.end) && (daysBetween(startKey, key) % 7 === 0));
        return {
          key: bucket.key,
          label: bucket.label,
          days: weekStarts.map((start) => {
            // minggunya utuh tujuh hari walau melewati akhir bulan, supaya tidak ada hari yang tidak terhitung;
            // garisnya ditaruh di bulan tempat minggu itu dimulai
            const end = [shiftKey(start, 6), endKey].sort()[0];
            const total = sumRange(start, end);
            return {
              key: start,
              label: `${shortDate.format(fromKey(start))} sampai ${shortDate.format(fromKey(end))}`,
              active: total[0] + total[1] + total[2] > 0,
              detail: describe(total),
            };
          }),
        };
      })
    : (() => {
        const groups = new Map<string, string[]>();
        for (const key of allDays) {
          const monday = shiftKey(key, -((fromKey(key).getUTCDay() + 6) % 7));
          groups.set(monday, [...(groups.get(monday) ?? []), key]);
        }
        return [...groups.entries()].map(([monday, keys]) => ({
          key: monday,
          label: shortDay.format(fromKey(keys[0])),
          days: keys.map((key) => ({ key, label: dayDate.format(fromKey(key)), active: madeOn.has(key), detail: describe(madeOn.get(key) ?? [0, 0, 0]) })),
        }));
      })();
  const stripLines = strip.flatMap((group) => group.days);
  const activeLines = stripLines.filter((line) => line.active).length;
  const longestStreak = stripLines.reduce(
    (state, line) => {
      const run = line.active ? state.run + 1 : 0;
      return { run, best: Math.max(state.best, run) };
    },
    { run: 0, best: 0 },
  ).best;
  const lineUnit = byWeek ? "minggu" : "hari";

  /* -------------------------------- pembaca -------------------------------- */
  const totalViews = views.reduce((sum, row) => sum + row.views, 0);
  const viewsBefore = viewsWide.filter((row) => before(row.day)).reduce((sum, row) => sum + row.views, 0);
  const viewsLastDay = views.filter((row) => row.day === endKey).reduce((sum, row) => sum + row.views, 0);
  const comments = allComments.filter((comment) => inRange(stampKey(comment.created_at)));
  const commentsBefore = allComments.filter((comment) => before(stampKey(comment.created_at))).length;
  const busiest = [...views.reduce((map, row) => map.set(row.day, (map.get(row.day) ?? 0) + row.views), new Map<string, number>())].sort((a, b) => b[1] - a[1])[0];
  const postsRead = new Set(views.filter((row) => row.views > 0).map((row) => row.post_id)).size;
  const postsReadBefore = new Set(viewsWide.filter((row) => before(row.day) && row.views > 0).map((row) => row.post_id)).size;
  const perDayAverage = totalViews / lengthDays;

  const read = buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    longLabel: bucket.longLabel,
    values: [views.filter((row) => inRange(row.day, bucket.start, bucket.end)).reduce((sum, row) => sum + row.views, 0)],
  }));

  const ranking = (counts: Map<string, number>) =>
    [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .flatMap(([id, value]) => {
        const post = postById.get(id);
        return post ? [{ key: id, label: post.title || "Tanpa judul", value, href: `/admin/tulisan/${id}` }] : [];
      });
  const viewsPerPost = new Map<string, number>();
  for (const row of views) viewsPerPost.set(row.post_id, (viewsPerPost.get(row.post_id) ?? 0) + row.views);
  const commentsPerPost = new Map<string, number>();
  for (const comment of comments) commentsPerPost.set(comment.post_id, (commentsPerPost.get(comment.post_id) ?? 0) + 1);

  // tag dari tulisan yang terbit di rentang ini
  const perTag = tags.map((tag) => ({
    key: tag.id,
    label: tag.name,
    value: published.filter(({ post }) => post.post_tags.some((item) => item.tag_id === tag.id)).length,
  }));

  // label sumbu bawah dijarangkan supaya sekitar tujuh yang tampil, berapa pun jumlah kolomnya
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));

  return (
    <div className="flex flex-col gap-4">
      {/* kepala: sapaan di kiri; pilihan rentang dan tanggal persisnya di kanan, jadi satu kesatuan */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-[-0.01em] sm:text-[2.125rem]">
            {greeting(now)}, {site.authorShort}
          </h1>
          <p className="text-[15px] text-muted">{longDate.format(fromKey(todayKey))}</p>
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <RangeFilter
            options={RANGES.map((item) => ({ key: item.key, label: item.label, href: item.key === "30" ? "/admin" : `/admin?rentang=${item.key}` }))}
            activeKey={rangeKey}
            from={startKey}
            to={endKey}
            max={todayKey}
          />
          <p className="text-[13px] text-muted">
            <span className="font-medium text-ink">{span(startKey, endKey)}</span> · {number.format(lengthDays)} hari
          </p>
        </div>
      </div>

      <GroupTitle title="Seberapa Produktif" />
      {/* enam kartu: empat tentang apa yang dibuat dalam rentang ini (angka besarnya total rentang), dua tentang keadaan sekarang */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Tulisan terbit" value={number.format(published.length)} note={`dari ${number.format(publishedAll.length)} tulisan seluruhnya`} icon={PenIcon}>
          <MiniCompare current={published.length} previous={publishedBefore.length} />
        </StatCard>
        <StatCard
          label="Kata ditulis"
          value={number.format(rangeWords)}
          note={published.length > 0 ? `Rata-rata ${number.format(averageWords)} kata per tulisan` : "Belum ada tulisan terbit di rentang ini"}
          icon={PenIcon}
        >
          <MiniCompare current={rangeWords} previous={wordsBefore} />
        </StatCard>
        <StatCard label="Ocehan" value={number.format(quips.length)} note={`dari ${number.format(allQuips.length)} ocehan seluruhnya`} icon={QuoteIcon}>
          <MiniCompare current={quips.length} previous={quipsBefore} />
        </StatCard>
        <StatCard label="Lagu ditambah" value={number.format(tracks.length)} note={`dari ${number.format(allTracks.length)} lagu seluruhnya`} icon={MusicIcon}>
          <MiniCompare current={tracks.length} previous={tracksBefore} />
        </StatCard>
        <StatCard
          label="Terakhir terbit"
          value={daysSince === null ? "-" : daysSince === 0 ? "Hari ini" : `${number.format(daysSince)} hari lalu`}
          note={lastPublished ? fullDate.format(fromKey(lastPublished)) : "Belum ada tulisan terbit"}
          icon={PenIcon}
        >
          <MiniFacts
            rows={[
              { label: "Judulnya", value: lastPost ? lastPost.post.title || "Tanpa judul" : "-" },
              { label: "Panjangnya", value: lastPost ? `${number.format(words(lastPost.post.content_html))} kata` : "-" },
            ]}
          />
        </StatCard>
        <StatCard
          label="Draf belum terbit"
          value={number.format(drafts)}
          note={oldestDraft ? `Yang tertua dibuat ${number.format(daysBetween(stampKey(oldestDraft.created_at), todayKey))} hari lalu` : "Nggak ada yang menggantung"}
          icon={PenIcon}
        >
          <MiniFacts
            rows={[
              { label: "Draf tertua", value: oldestDraft ? oldestDraft.title || "Tanpa judul" : "-" },
              { label: "Kata di draf", value: `${number.format(draftWords)} kata` },
            ]}
          />
        </StatCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Tulisan dan Ocehan" note={phrase} icon={PenIcon}>
          <ColumnChart data={made} series={["Tulisan", "Ocehan"]} unit="dibuat" labelEvery={labelEvery} empty={`Belum ada tulisan atau ocehan dalam ${phrase}.`} />
        </SectionCard>
        <SectionCard title="Garis Waktu Aktivitas" note={phrase} icon={QuoteIcon}>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[1.75rem] font-semibold leading-none tabular-nums">{number.format(activeLines)}</span>
                <span className="text-xs text-muted">
                  {lineUnit} aktif dari {number.format(stripLines.length)}
                </span>
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[1.75rem] font-semibold leading-none tabular-nums">{number.format(longestStreak)}</span>
                <span className="text-xs text-muted">{lineUnit} berturut-turut, paling lama</span>
              </p>
            </div>
            <ActivityStrip
              weeks={strip}
              labelEvery={byWeek ? 2 : strip.length > 6 ? 3 : 1}
              hint={`Tiap garis satu ${lineUnit}. Yang tinggi dan hitam berarti ${lineUnit} itu kamu bikin sesuatu.`}
            />
          </div>
        </SectionCard>
      </div>

      <GroupTitle title="Seberapa Dibaca" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Dibaca" value={number.format(totalViews)} note={endKey === todayKey ? `${number.format(viewsLastDay)} di antaranya hari ini` : `${number.format(viewsLastDay)} di antaranya pada ${shortDate.format(fromKey(endKey))}`} icon={EyeIcon}>
          <MiniCompare current={totalViews} previous={viewsBefore} />
        </StatCard>
        <StatCard
          label="Rata-rata per hari"
          value={perDayAverage >= 10 ? number.format(Math.round(perDayAverage)) : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(perDayAverage)}
          note={busiest && busiest[1] > 0 ? `Paling ramai ${shortDate.format(fromKey(busiest[0]))}: ${number.format(busiest[1])}` : "Belum ada hari yang tercatat"}
          icon={EyeIcon}
        >
          <MiniCompare current={perDayAverage} previous={viewsBefore / lengthDays} digits={1} />
        </StatCard>
        <StatCard
          label="Tulisan yang dibaca"
          value={number.format(postsRead)}
          note={`dari ${number.format(publishedAll.length)} tulisan terbit`}
          icon={PenIcon}
        >
          <MiniCompare current={postsRead} previous={postsReadBefore} />
        </StatCard>
        <StatCard label="Komentar" value={number.format(comments.length)} note={`dari ${number.format(allComments.length)} komentar seluruhnya`} icon={CommentIcon}>
          <MiniCompare current={comments.length} previous={commentsBefore} />
        </StatCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard title="Dibaca" note={phrase} icon={EyeIcon}>
          <ColumnChart
            data={read}
            series={["Dibaca"]}
            unit="kali dibaca"
            labelEvery={labelEvery}
            empty={`Belum ada yang tercatat dalam ${phrase}. Hitungannya jalan begitu ada yang membuka tulisan.`}
          />
          {/* pencatatan baca baru ada sejak tanggal ini; hanya disebut kalau rentangnya menjangkau sebelum itu */}
          {startKey < VIEWS_SINCE ? (
            <p className="pt-3 text-xs text-muted">
              Pencatatan baca baru dipasang {fullDate.format(fromKey(VIEWS_SINCE))}, jadi hari-hari sebelum itu di rentang ini tercatat nol.
            </p>
          ) : null}
        </SectionCard>
        <SectionCard title="Tulisan per Tag" note={phrase} icon={TagIcon}>
          <DonutChart data={perTag} centerLabel="pemakaian tag" empty={`Belum ada tulisan bertag yang terbit dalam ${phrase}.`} />
        </SectionCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Paling Banyak Dibaca" note={phrase} icon={PenIcon}>
          <BarList data={ranking(viewsPerPost)} empty={`Belum ada tulisan yang tercatat dibaca dalam ${phrase}.`} />
        </SectionCard>
        <SectionCard title="Paling Banyak Dikomentari" note={phrase} icon={CommentIcon}>
          <BarList data={ranking(commentsPerPost)} empty={`Belum ada komentar dalam ${phrase}.`} />
        </SectionCard>
      </div>
    </div>
  );
}

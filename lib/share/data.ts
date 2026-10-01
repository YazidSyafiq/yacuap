import "server-only";
import { coverUrl } from "@/lib/playlist";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/** Rasio kartu: 4:5 untuk Instagram, 9:16 untuk TikTok dan Story. */
export type ShareRatio = "4x5" | "9x16";

/** Satu potong isi di dalam slide: judul bagian, paragraf (termasuk butir daftar), atau kutipan. */
export type ShareBlock = { type: "heading" | "text" | "quote"; text: string };

/** Jumlah karakter yang muat di satu slide dengan huruf yang masih enak dibaca di HP. */
const SLIDE_BUDGET = 430;
/** Judul bagian memakan tempat lebih banyak daripada jumlah hurufnya (huruf lebih besar, jarak lebih lega). */
const HEADING_COST = 90;
/** Jarak antarpotongan ikut dihitung sebagai "karakter". */
const GAP_COST = 30;
export const QUOTE_MAX_LENGTH = 220;

export type SharePost = {
  id: string;
  title: string;
  slug: string;
  cover: string | null;
  readingTime: number;
  tag: string | null;
  /** Semua kutipan (blockquote) di dalam tulisan, urut; masing-masing jadi satu kartu kutipan. */
  quotes: string[];
  /** Seluruh isi tulisan, sudah dibagi per slide carousel (tanpa slide judul dan slide penutup). */
  slides: ShareBlock[][];
};

function unescape(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Teks polos dari HTML. Tag di dalam kalimat (miring, tebal, tautan) dibuang tanpa spasi, supaya tanda baca tetap menempel. */
const plain = (html: string) =>
  unescape(html.replace(/<\/?(em|strong|a|i|b|u|s|span)\b[^>]*>/g, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/** Semua kutipan (blockquote) di dalam isi tulisan, urut. Yang kelewat panjang dipotong supaya muat di kartu. */
export function quotesFromHtml(html: string) {
  return [...html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g)]
    .map((match) => plain(match[1]))
    .filter(Boolean)
    .map((text) => (text.length > QUOTE_MAX_LENGTH ? `${text.slice(0, QUOTE_MAX_LENGTH - 1).trimEnd()}…` : text));
}

/** Satu gambar dalam urutan unggah: kartu judul, kartu kutipan, slide isi, atau slide penutup. */
export type ShareItem =
  | { type: "title" }
  | { type: "quote"; text: string }
  | { type: "text"; blocks: ShareBlock[] }
  | { type: "closing" };

/**
 * Isi tulisan (HTML dari editor) sebagai deretan potongan, urut seperti di tulisannya.
 * Judul bagian, paragraf, butir daftar, dan kutipan ikut; gambar, kartu lagu, dan pemisah dilewati.
 */
export function blocksFromHtml(html: string): ShareBlock[] {
  const blocks: ShareBlock[] = [];
  const pattern = /<(h2|h3|p|blockquote|ul|ol)[^>]*>([\s\S]*?)<\/\1>/g;
  // kartu lagu berisi tautan cadangan, bukan isi tulisan
  const source = html.replace(/<div data-track-card[\s\S]*?<\/div>/g, "");
  for (const match of source.matchAll(pattern)) {
    const [, tag, inner] = match;
    if (tag === "ul" || tag === "ol") {
      [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].forEach((item, i) => {
        const text = plain(item[1]);
        if (text) blocks.push({ type: "text", text: `${tag === "ol" ? `${i + 1}.` : "•"} ${text}` });
      });
      continue;
    }
    const text = plain(inner);
    if (!text) continue;
    blocks.push({ type: tag === "blockquote" ? "quote" : tag === "p" ? "text" : "heading", text });
  }
  return blocks;
}

/** Memecah teks yang terlalu panjang untuk satu slide, di batas kalimat (atau batas kata kalau kalimatnya sendiri kepanjangan). */
function splitLong(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let current = "";
  for (const sentence of text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text]) {
    if ((current + sentence).length <= max) {
      current += sentence;
      continue;
    }
    if (current.trim()) parts.push(current.trim());
    current = "";
    let rest = sentence;
    while (rest.length > max) {
      const cut = rest.lastIndexOf(" ", max);
      const at = cut > max * 0.5 ? cut : max;
      parts.push(rest.slice(0, at).trim());
      rest = rest.slice(at);
    }
    current = rest;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const cost = (block: ShareBlock) => (block.type === "heading" ? block.text.length + HEADING_COST : block.text.length) + GAP_COST;

/**
 * Membagi seluruh isi tulisan ke slide-slide carousel, otomatis dan lengkap, tanpa perlu dipilih satu per satu.
 * Tiap slide diisi sampai kira-kira penuh. Judul bagian selalu membuka slide baru supaya tidak tertinggal
 * sendirian di dasar slide. Paragraf yang kepanjangan dipecah di batas kalimat.
 */
export function slidesFromHtml(html: string): ShareBlock[][] {
  const slides: ShareBlock[][] = [];
  let current: ShareBlock[] = [];
  let used = 0;
  const flush = () => {
    if (current.length > 0) slides.push(current);
    current = [];
    used = 0;
  };

  for (const block of blocksFromHtml(html)) {
    const pieces = block.type === "heading" ? [block] : splitLong(block.text, SLIDE_BUDGET - GAP_COST).map((text) => ({ type: block.type, text }));
    for (const piece of pieces) {
      if (piece.type === "heading" || used + cost(piece) > SLIDE_BUDGET) flush();
      current.push(piece);
      used += cost(piece);
    }
  }
  flush();
  return slides;
}

type Row = {
  id: string;
  title: string;
  slug: string;
  cover_path: string | null;
  reading_time: number;
  content_html: string;
  post_tags: { tags: { name: string; position: number } | null }[] | null;
};

export const SHARE_SELECT = "id, title, slug, cover_path, reading_time, content_html, post_tags(tags(name, position))";
export type ShareRow = Row;

/** Bahan kartu dari satu baris tulisan. Semuanya otomatis dari isi tulisan; tidak ada yang perlu diatur di admin. */
export function toSharePost(row: Row): SharePost {
  const tags = (row.post_tags ?? []).flatMap((item) => (item.tags ? [item.tags] : [])).sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    cover: coverUrl(row.cover_path),
    readingTime: row.reading_time,
    tag: tags[0]?.name ?? null,
    quotes: quotesFromHtml(row.content_html),
    slides: slidesFromHtml(row.content_html),
  };
}

/** Tulisan terbit menurut alamatnya, untuk membuat kartu. Draf tidak bisa dibuatkan kartu dari luar. */
export async function getSharePost(slug: string): Promise<SharePost | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient().from("posts").select(SHARE_SELECT).eq("status", "published").eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return toSharePost(data as unknown as Row);
  } catch {
    return null;
  }
}

/**
 * Urutan gambar sebuah tulisan, sudah siap diunggah berurutan: kartu judul, lalu satu kartu untuk tiap kutipan,
 * lalu slide-slide isi, lalu slide penutup. Tidak ada gambar yang dobel: kartu judul sekaligus jadi slide pertama.
 */
export function shareSequence(post: SharePost): ShareItem[] {
  return [
    { type: "title" },
    ...post.quotes.map((text) => ({ type: "quote" as const, text })),
    ...post.slides.map((blocks) => ({ type: "text" as const, blocks })),
    { type: "closing" },
  ];
}

const ITEM_NAMES: Record<ShareItem["type"], string> = { title: "judul", quote: "kutipan", text: "isi", closing: "penutup" };
export const ITEM_LABELS: Record<ShareItem["type"], string> = { title: "Judul", quote: "Kutipan", text: "Isi", closing: "Penutup" };

/** Nama file sebuah gambar: nomor urutnya dulu, supaya di galeri HP tetap berurutan. */
export function shareFileName(item: ShareItem, index: number) {
  return `${String(index + 1).padStart(2, "0")}-${ITEM_NAMES[item.type]}.png`;
}

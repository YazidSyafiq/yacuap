import "server-only";
import { coverUrl } from "@/lib/playlist";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Tag tulisan. Dulu kategori tetap (musik, pikiran, absurd); sekarang tabel sendiri,
 * bisa ditambah kapan saja dari admin, dan satu tulisan boleh punya beberapa tag.
 */
export type Tag = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Urutan tampil; juga menentukan gaya chip (gelap, abu, atau bergaris). */
  position: number;
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Alamat cover yang sudah monokrom, atau null kalau tidak ada. */
  cover: string | null;
  publishedAt: string;
  readingTime: number;
  tags: Tag[];
};

export type Post = PostSummary & { html: string };

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_path: string | null;
  published_at: string;
  reading_time: number;
  content_html?: string;
  post_tags: { tags: Tag | null }[] | null;
};

const SUMMARY =
  "id, title, slug, excerpt, cover_path, published_at, reading_time, post_tags(tags(id, name, slug, description, position))";

function toSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    cover: coverUrl(row.cover_path),
    publishedAt: row.published_at,
    readingTime: row.reading_time,
    tags: (row.post_tags ?? [])
      .flatMap((item) => (item.tags ? [item.tags] : []))
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)),
  };
}

/** Semua tag, urut sesuai `position`. Tidak pernah melempar galat: kalau gagal, hasilnya daftar kosong. */
export async function getTags(): Promise<Tag[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from("tags")
      .select("id, name, slug, description, position")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as Tag[];
  } catch {
    return [];
  }
}

/**
 * Semua tulisan yang sudah terbit, terbaru dulu. Situs pribadi, jumlahnya sedikit,
 * jadi diambil sekaligus; menyaring per tag dilakukan di sini, bukan di query.
 */
export async function getPosts(tagSlug?: string): Promise<PostSummary[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(SUMMARY)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    const posts = (data as unknown as PostRow[]).map(toSummary);
    return tagSlug ? posts.filter((post) => post.tags.some((tag) => tag.slug === tagSlug)) : posts;
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient()
      .from("posts")
      .select(`${SUMMARY}, content_html`)
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as unknown as PostRow;
    return { ...toSummary(row), html: row.content_html ?? "" };
  } catch {
    return null;
  }
}

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** "12 September 2026 · 7 menit baca" */
export function postMeta(post: PostSummary) {
  return `${dateFormat.format(new Date(post.publishedAt))} · ${post.readingTime} menit baca`;
}

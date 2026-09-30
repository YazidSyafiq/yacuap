import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { PostManager, type PostItem } from "./forms";

export const metadata: Metadata = { title: "Tulisan" };

type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_path: string | null;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  post_tags: { tags: { id: string; name: string; position: number } | null }[];
};

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** Daftar semua tulisan, termasuk draf. Saringan, pencarian, dan pop up-nya ada di PostManager. */
export default async function AdminTulisanPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_path, status, published_at, updated_at, post_tags(tags(id, name, position))")
    .order("updated_at", { ascending: false });

  const posts: PostItem[] = ((data ?? []) as unknown as Row[]).map((row) => {
    const published = row.status === "published";
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      cover: coverUrl(row.cover_path),
      published,
      dateLabel:
        published && row.published_at
          ? `Terbit ${dateFormat.format(new Date(row.published_at))}`
          : `Diubah ${dateFormat.format(new Date(row.updated_at))}`,
      tags: row.post_tags
        .flatMap((item) => (item.tags ? [item.tags] : []))
        .sort((a, b) => a.position - b.position),
    };
  });

  return <PostManager posts={posts} />;
}

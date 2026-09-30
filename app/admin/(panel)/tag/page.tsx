import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { TagManager, type Tag } from "./forms";

export const metadata: Metadata = { title: "Tag" };

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  post_tags: { count: number }[];
};

/** Tag tulisan: bisa ditambah kapan saja, tidak terbatas pada Musik, Pikiran, dan Absurd. */
export default async function AdminTagPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("tags")
    .select("id, name, slug, description, position, post_tags(count)")
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  const tags: Tag[] = ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    position: row.position,
    count: row.post_tags[0]?.count ?? 0,
  }));

  return <TagManager tags={tags} />;
}

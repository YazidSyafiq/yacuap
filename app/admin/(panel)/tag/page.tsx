import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { TagChip } from "@/components/ui/chip";
import { requireAdmin } from "@/lib/auth";
import { NewTagForm, TagForm } from "./forms";

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
  const tags = (data ?? []) as unknown as Row[];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[2.125rem] font-medium">Tag</h1>
        <p className="text-sm text-muted">
          Tag dipakai untuk mengelompokkan tulisan. Tiap tag punya halaman sendiri dan muncul di pilihan &quot;Mau yang
          mana?&quot;. Satu tulisan boleh punya lebih dari satu tag.
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-medium">Tag baru</h2>
        <NewTagForm />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-medium">Tag yang ada ({tags.length})</h2>
        {tags.length === 0 ? (
          <p className="text-sm text-muted">Belum ada tag.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Card className="flex flex-col gap-4 p-5">
                  <TagChip tag={tag} className="self-start" />
                  <TagForm
                    tag={{
                      id: tag.id,
                      name: tag.name,
                      slug: tag.slug,
                      description: tag.description,
                      count: tag.post_tags[0]?.count ?? 0,
                    }}
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

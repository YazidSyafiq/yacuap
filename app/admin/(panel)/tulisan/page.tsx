import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon } from "@/components/admin/icons";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { coverUrl } from "@/lib/playlist";

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

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "terbit", label: "Terbit" },
  { key: "draf", label: "Draf" },
] as const;

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** Daftar semua tulisan, termasuk draf, sebagai kartu. Saringan status lewat ?status=terbit atau ?status=draf. */
export default async function AdminTulisanPage({ searchParams }: PageProps<"/admin/tulisan">) {
  const { status } = await searchParams;
  const filter = status === "terbit" || status === "draf" ? status : "semua";

  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, cover_path, status, published_at, updated_at, post_tags(tags(id, name, position))")
    .order("updated_at", { ascending: false });
  const all = (data ?? []) as unknown as Row[];

  const counts = {
    semua: all.length,
    terbit: all.filter((post) => post.status === "published").length,
    draf: all.filter((post) => post.status === "draft").length,
  };
  const posts = all.filter(
    (post) => filter === "semua" || (filter === "terbit" ? post.status === "published" : post.status === "draft"),
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tulisan"
        note="Semua tulisan ada di sini, yang sudah terbit maupun yang masih draf. Editor buat nulis langsung dari sini belum ada, nyusul."
      />

      <nav aria-label="Saring menurut status" className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const active = key === filter;
          return (
            <Link
              key={key}
              href={key === "semua" ? "/admin/tulisan" : `/admin/tulisan?status=${key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium",
                active ? "border-ink bg-surface text-ink" : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {label}
              <span className={cn("rounded-md px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-ink text-surface" : "bg-bg text-muted")}>
                {counts[key]}
              </span>
            </Link>
          );
        })}
      </nav>

      {posts.length === 0 ? (
        <p className="py-6 text-[15px] text-muted">
          {all.length === 0 ? "Belum ada tulisan sama sekali." : "Nggak ada tulisan dengan status ini."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => {
            const cover = coverUrl(post.cover_path);
            const published = post.status === "published";
            const tags = post.post_tags
              .flatMap((item) => (item.tags ? [item.tags] : []))
              .sort((a, b) => a.position - b.position);
            return (
              <li key={post.id}>
                <Card className="flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[16/9] bg-(--cover)">
                    {cover ? (
                      <Image src={cover} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized className="mono-img object-cover" />
                    ) : null}
                    <span
                      className={cn(
                        "absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        published ? "bg-ink text-surface" : "border border-border-strong bg-surface text-ink",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", published ? "bg-surface" : "bg-muted")} />
                      {published ? "Terbit" : "Draf"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {tags.length > 0 ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                        {tags.map((tag) => tag.name).join(" · ")}
                      </p>
                    ) : null}
                    <h2 className="line-clamp-2 text-[17px] font-semibold leading-snug">{post.title || "Tanpa judul"}</h2>
                    {post.excerpt ? <p className="line-clamp-2 text-sm text-muted">{post.excerpt}</p> : null}
                    <p className="mt-auto pt-1 text-[13px] text-muted">
                      {published && post.published_at
                        ? dateFormat.format(new Date(post.published_at))
                        : `Diubah ${dateFormat.format(new Date(post.updated_at))}`}
                    </p>
                  </div>
                  {published ? (
                    <div className="border-t border-line p-3">
                      <a
                        href={`/tulisan/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium hover:border-border-strong"
                      >
                        <EyeIcon className="size-[18px]" />
                        Lihat di situs
                      </a>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

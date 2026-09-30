import Image from "next/image";
import Link from "next/link";
import { TagChip } from "@/components/ui/chip";
import { cn } from "@/lib/cn";
import { postMeta, type PostSummary, type Tag } from "@/lib/posts";

/**
 * Cara kartu tulisan bisa diklik: tautan judulnya direntangkan ke seluruh kartu (after:inset-0),
 * sedangkan chip tag berada di atasnya (relative z-10) dan mengarah ke halaman tagnya sendiri.
 * Jadi tidak ada tautan di dalam tautan.
 */
const stretched = "after:absolute after:inset-0";

/** Deretan chip tag sebuah tulisan; tiap chip menuju halaman tagnya. */
export function PostTags({ tags, className }: { tags: Tag[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <ul className={cn("relative z-10 flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <li key={tag.id} className="flex">
          <Link href={`/${tag.slug}`} aria-label={`Tulisan bertag ${tag.name}`} className="flex rounded-full">
            <TagChip tag={tag} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Cover({ post, sizes, className }: { post: PostSummary; sizes: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block overflow-hidden rounded-2xl bg-(--cover)", className)}>
      {post.cover ? (
        <Image
          src={post.cover}
          alt=""
          fill
          sizes={sizes}
          unoptimized
          className="mono-img object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : null}
    </span>
  );
}

/**
 * Kartu tulisan: cover lebar di atas, lalu tag, judul, ringkasan.
 * Dipakai untuk dua tulisan terbaru di beranda dan untuk kisi dua kolom di halaman daftar.
 */
export function PostCard({ post, titleAs: Title = "h3" }: { post: PostSummary; titleAs?: "h2" | "h3" }) {
  return (
    <article className="group relative flex min-w-0 flex-col gap-4">
      <Cover post={post} sizes="(min-width: 1024px) 45vw, 100vw" className="aspect-[2/1]" />
      <div className="flex flex-col gap-2.5">
        <PostTags tags={post.tags} />
        <Title className="font-display text-[1.5rem] font-medium leading-tight sm:text-[1.875rem]">
          <Link href={`/tulisan/${post.slug}`} className={cn(stretched, "group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4")}>
            {post.title}
          </Link>
        </Title>
        {post.excerpt ? <p className="line-clamp-2 text-[17px] leading-normal text-muted">{post.excerpt}</p> : null}
        <p className="font-ui text-[13px] text-muted">{postMeta(post)}</p>
      </div>
    </article>
  );
}

/** Baris tulisan ala Medium, dipakai di beranda dan di bawah halaman baca: teks di kiri, cover kecil di kanan, garis pemisah di bawah. */
export function PostRow({
  post,
  titleAs: Title = "h2",
  className,
}: {
  post: PostSummary;
  titleAs?: "h2" | "h3";
  className?: string;
}) {
  return (
    <article className={cn("group relative flex items-start gap-5 border-b border-line py-7 sm:gap-8", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <PostTags tags={post.tags} />
        <Title className="font-display text-[1.375rem] font-medium leading-tight sm:text-[1.75rem]">
          <Link href={`/tulisan/${post.slug}`} className={cn(stretched, "group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4")}>
            {post.title}
          </Link>
        </Title>
        {post.excerpt ? (
          <p className="line-clamp-2 text-[17px] leading-normal text-muted sm:line-clamp-3">{post.excerpt}</p>
        ) : null}
        <p className="font-ui text-[13px] text-muted">{postMeta(post)}</p>
      </div>
      <Cover post={post} sizes="220px" className="aspect-square w-24 shrink-0 rounded-xl sm:aspect-[4/3] sm:w-[220px] sm:rounded-2xl" />
    </article>
  );
}

/**
 * Saringan tag di atas daftar tulisan, berbentuk tab: "Semua" lalu tiap tag dengan jumlah tulisannya.
 * Tab yang aktif bergaris bawah tebal. Di layar sempit deretannya bisa digeser ke samping.
 */
export function TagTabs({ tags, posts, current }: { tags: Tag[]; posts: PostSummary[]; current?: string }) {
  const tabs = [
    { key: "semua", href: "/tulisan", label: "Semua", count: posts.length, active: !current },
    ...tags.map((tag) => ({
      key: tag.id,
      href: `/${tag.slug}`,
      label: tag.name,
      count: posts.filter((post) => post.tags.some((item) => item.id === tag.id)).length,
      active: tag.slug === current,
    })),
  ];

  return (
    <nav aria-label="Saring tulisan menurut tag" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-7 border-b border-line">
        {tabs.map((tab) => (
          <li key={tab.key} className="flex">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "-mb-px flex items-baseline gap-1.5 border-b-2 pb-3 font-ui text-[15px]",
                tab.active
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent font-medium text-muted hover:text-ink",
              )}
            >
              {tab.label}
              <span className="text-xs font-medium tabular-nums text-muted">{tab.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

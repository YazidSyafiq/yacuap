import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorPhoto } from "@/components/site/author-photo";
import { Comments, type CommentItem } from "@/components/site/comments";
import { PostRow, PostTags } from "@/components/site/post-cards";
import { StoryBody } from "@/components/site/story-body";
import { ViewPing } from "@/components/site/view-ping";
import { ReadColumn } from "@/components/ui/container";
import { getComments } from "@/lib/comments";
import { getPost, getPosts, postMeta } from "@/lib/posts";
import { site } from "@/lib/site";

export const revalidate = 300;

const commentDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

// tulisan yang sudah ada dibuat saat build; yang baru terbit dibuat saat pertama dibuka
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tulisan/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  };
}

/**
 * Halaman baca ala Medium: satu kolom 680px di tengah, dibaca lurus dari atas ke bawah.
 * Judul, cover, isi, dan daftar tulisan lain semuanya sama lebar.
 */
export default async function ReadPage({ params }: PageProps<"/tulisan/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [others, comments] = await Promise.all([getPosts(), getComments(post.id)]);
  const more = others.filter((item) => item.id !== post.id).slice(0, 3);
  const commentItems: CommentItem[] = comments.map((comment) => ({
    id: comment.id,
    name: comment.name,
    body: comment.body,
    dateLabel: commentDate.format(new Date(comment.createdAt)),
  }));

  return (
    <ReadColumn className="py-10 md:py-14">
      {/* mencatat satu kali baca untuk statistik dashboard */}
      <ViewPing slug={post.slug} />
      <article>
        <header className="flex flex-col gap-5">
          <PostTags tags={post.tags} />
          <h1 className="font-display text-[2.125rem] font-medium leading-[1.12] tracking-[-0.01em] sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="text-xl italic leading-snug text-muted sm:text-[22px]">{post.excerpt}</p>
          ) : null}
          <div className="flex items-center gap-3.5 pt-2">
            {/* penulisnya selalu satu orang, fotonya sama di seluruh situs */}
            <AuthorPhoto size={56} />
            <div className="flex flex-col gap-0.5 font-ui">
              <span className="text-[15px] font-semibold">{site.author}</span>
              <span className="text-[13px] text-muted">{postMeta(post)}</span>
            </div>
          </div>
        </header>

        {post.cover ? (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-(--cover)">
            <Image src={post.cover} alt="" fill priority sizes="(min-width: 680px) 680px, 100vw" unoptimized className="mono-img object-cover" />
          </div>
        ) : null}

        {/* isi tulisan ditulis penulis sendiri lewat admin dan disimpan sebagai HTML; kartu lagunya dihidupkan di sini */}
        <StoryBody html={post.html} className="mt-10 sm:mt-12" />
      </article>

      <div className="mt-16 sm:mt-20">
        <Comments postId={post.id} slug={post.slug} comments={commentItems} />
      </div>

      {more.length > 0 ? (
        <section className="mt-16 flex flex-col sm:mt-20">
          <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
            <h2 className="font-display text-2xl font-medium">Masih ada yang lain, nih</h2>
            <Link href="/tulisan" className="shrink-0 font-ui text-sm font-medium text-muted hover:text-ink">
              Semua tulisan
            </Link>
          </div>
          {more.map((item) => (
            <PostRow key={item.id} post={item} titleAs="h3" />
          ))}
        </section>
      ) : null}
    </ReadColumn>
  );
}

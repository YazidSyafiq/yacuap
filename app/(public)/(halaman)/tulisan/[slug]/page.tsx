import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostRow, PostTags } from "@/components/site/post-cards";
import { ReadColumn } from "@/components/ui/container";
import { getPost, getPosts, postMeta } from "@/lib/posts";
import { site } from "@/lib/site";

export const revalidate = 300;

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
  const more = (await getPosts()).filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <ReadColumn className="py-10 md:py-14">
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
            {/*
              Penulisnya selalu satu orang: gambar dari bagian Oknumnya, utuh di dalam lingkaran.
              Lingkarannya kebalikan tema: hitam di mode terang, abu terang di mode gelap.
            */}
            <Image
              src="/oknum/penulis-hitam.png"
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-full dark:hidden"
            />
            <Image
              src="/oknum/penulis-abu.png"
              alt=""
              width={56}
              height={56}
              className="hidden size-14 shrink-0 rounded-full dark:block"
            />
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

        {/* isi tulisan ditulis penulis sendiri lewat admin dan disimpan sebagai HTML */}
        <div className="tulisan mt-10 sm:mt-12" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>

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

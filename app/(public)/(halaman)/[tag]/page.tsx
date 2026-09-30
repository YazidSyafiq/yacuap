import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard, TagTabs } from "@/components/site/post-cards";
import { Container, Eyebrow } from "@/components/ui/container";
import { getPosts, getTags } from "@/lib/posts";

export const revalidate = 300;

// Tag yang sudah ada dibuat saat build; tag yang baru ditambahkan dari admin dibuat saat pertama dibuka.
export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[tag]">): Promise<Metadata> {
  const { tag: slug } = await params;
  const tag = (await getTags()).find((item) => item.slug === slug);
  if (!tag) return {};
  return { title: tag.name, description: tag.description || `Tulisan bertag ${tag.name}.` };
}

/** Halaman satu tag, misalnya /musik: daftar tulisan yang bertag itu, dengan tab tag yang sama seperti /tulisan. */
export default async function TagPage({ params }: PageProps<"/[tag]">) {
  const { tag: slug } = await params;
  const [tags, all] = await Promise.all([getTags(), getPosts()]);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) notFound();
  const posts = all.filter((post) => post.tags.some((item) => item.id === tag.id));

  return (
    <Container className="flex flex-col gap-8 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Eyebrow>Tulisan</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="max-w-[680px] text-xl leading-relaxed text-muted">{tag.description}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-10">
        <TagTabs tags={tags} posts={all} current={tag.slug} />
        {posts.length > 0 ? (
          // satu baris dua kartu; di HP jadi satu kolom
          <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} titleAs="h2" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="font-display text-2xl italic">Masih kosong, nih.</p>
            <p className="text-[17px] text-muted">Belum ada tulisan di tag ini. Bentar lagi diisi.</p>
          </div>
        )}
      </div>
    </Container>
  );
}

import type { Metadata } from "next";
import { PostCard, TagTabs } from "@/components/site/post-cards";
import { Container, Eyebrow } from "@/components/ui/container";
import { getPosts, getTags } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Tulisan",
  description: "Semua yang pernah ditulis di sini, urut dari yang paling baru.",
};

export const revalidate = 300;

/** Semua tulisan jadi satu daftar. Tab tag di atasnya menyaring ke halaman tag masing-masing. */
export default async function StoriesPage() {
  const [posts, tags] = await Promise.all([getPosts(), getTags()]);

  return (
    <Container className="flex flex-col gap-8 py-10 md:py-14">
      <header className="flex flex-col gap-4">
        <Eyebrow>Tulisan</Eyebrow>
        <h1 className="font-display text-[2.5rem] font-normal leading-[1.05] tracking-[-0.015em] sm:text-[3.5rem]">
          Semua yang pernah ditulis.
        </h1>
        <p className="max-w-[680px] text-xl leading-relaxed text-muted">
          Urut dari yang paling baru. Pilih aja mana yang judulnya bikin penasaran.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <TagTabs tags={tags} posts={posts} />
        {posts.length > 0 ? (
          // satu baris dua kartu; di HP jadi satu kolom
          <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} titleAs="h2" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="font-display text-2xl italic">Belum ada tulisan, nih.</p>
            <p className="text-[17px] text-muted">Lagi ditulis, sabar ya. Yang pertama bakal nongol di sini.</p>
          </div>
        )}
      </div>
    </Container>
  );
}

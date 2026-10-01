import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { CommentAdmin, type AdminComment } from "./comment-admin";
import { PostEditor, type EditorTag, type EditorTrack } from "./post-editor";

export const metadata: Metadata = { title: "Tulis" };

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

type Row = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  cover_path: string | null;
  status: "draft" | "published";
  post_tags: { tag_id: string }[];
};

/** Halaman editor satu tulisan (baru maupun lama). */
export default async function EditPostPage({ params }: PageProps<"/admin/tulisan/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: tagRows }, { data: trackRows }, { data: commentRows }] = await Promise.all([
    supabase.from("posts").select("id, title, slug, excerpt, content, cover_path, status, post_tags(tag_id)").eq("id", id).maybeSingle(),
    supabase.from("tags").select("id, name, position").order("position", { ascending: true }).order("name", { ascending: true }),
    supabase.from("tracks").select("id, title, artist, youtube_id, artwork_path").order("created_at", { ascending: false }),
    supabase.from("comments").select("id, name, body, created_at").eq("post_id", id).order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const post = data as unknown as Row;

  const tracks: EditorTrack[] = (trackRows ?? []).map((row) => ({
    id: String(row.id),
    youtubeId: String(row.youtube_id),
    title: String(row.title),
    artist: String(row.artist),
    artwork: coverUrl(row.artwork_path as string | null),
  }));
  const comments: AdminComment[] = (commentRows ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    body: String(row.body),
    dateLabel: dateFormat.format(new Date(String(row.created_at))),
  }));

  return (
    <div className="flex flex-col gap-8">
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        cover: coverUrl(post.cover_path),
        published: post.status === "published",
        tagIds: post.post_tags.map((item) => item.tag_id),
      }}
      tags={(tagRows ?? []) as EditorTag[]}
      tracks={tracks}
    />
      <CommentAdmin comments={comments} />
    </div>
  );
}

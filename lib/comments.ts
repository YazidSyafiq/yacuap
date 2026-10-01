import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export type Comment = { id: string; name: string; body: string; createdAt: string };

/** Komentar sebuah tulisan, dari yang paling lama. Tidak pernah melempar galat. */
export async function getComments(postId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from("comments")
      .select("id, name, body, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((row) => ({ id: String(row.id), name: String(row.name), body: String(row.body), createdAt: String(row.created_at) }));
  } catch {
    return [];
  }
}

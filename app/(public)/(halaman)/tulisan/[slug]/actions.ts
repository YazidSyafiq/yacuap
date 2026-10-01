"use server";

import { revalidatePath } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type CommentState = { error?: string; ok?: boolean } | undefined;

/**
 * Komentar anonim: nama dan isi, langsung tampil. Ada isian tersembunyi "website" sebagai jebakan bot:
 * manusia tidak mengisinya, bot biasanya mengisi. Ditulis lewat klien publik, jadi tunduk pada RLS.
 */
export async function createComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  if (String(formData.get("website") ?? "")) return { ok: true };

  const postId = String(formData.get("postId") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!postId || !slug) return { error: "Tulisannya tidak ditemukan." };
  if (!name) return { error: "Namanya diisi dulu, boleh nama panggilan." };
  if (body.length < 2) return { error: "Komentarnya diisi dulu." };

  const { error } = await createPublicClient().from("comments").insert({ post_id: postId, name, body });
  if (error) return { error: "Komentarnya gagal terkirim. Coba lagi sebentar lagi." };

  revalidatePath(`/tulisan/${slug}`);
  return { ok: true };
}

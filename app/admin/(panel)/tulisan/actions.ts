"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Tulisan tampil di beranda, daftar, halaman tag, dan halaman bacanya: segarkan semuanya. */
function refresh() {
  revalidatePath("/", "layout");
}

/** Menerbitkan atau menarik tulisan jadi draf. Tanggal terbit diisi saat pertama kali terbit. */
export async function setPostStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || (status !== "published" && status !== "draft")) return;

  const { data } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
  const publishedAt = status === "published" ? (data?.published_at ?? new Date().toISOString()) : data?.published_at ?? null;

  await supabase.from("posts").update({ status, published_at: publishedAt }).eq("id", id);
  refresh();
}

/** Menghapus tulisan beserta relasi tagnya (ikut terhapus lewat foreign key). */
export async function deletePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;

  await supabase.from("posts").delete().eq("id", id);
  refresh();
}

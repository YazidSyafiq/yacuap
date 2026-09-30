"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

/**
 * Alamat tag berada langsung di akar situs (/musik, /pikiran, ...),
 * jadi tidak boleh bentrok dengan halaman yang sudah ada.
 */
const RESERVED = new Set(["admin", "cerita", "tulisan", "playlist", "tentang", "tag", "api", "logo", "hero", "oknum"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** Tag tampil di beranda, daftar tulisan, halaman tag, dan halaman baca: segarkan semuanya. */
function refresh() {
  revalidatePath("/", "layout");
}

export async function createTag(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const name = text(formData, "name");
  if (!name) return { error: "Nama tagnya diisi dulu." };
  const slug = slugify(name);
  if (!slug) return { error: "Namanya harus mengandung huruf atau angka." };
  if (RESERVED.has(slug)) return { error: `Nama "${name}" sudah dipakai halaman lain di situs. Pilih nama lain.` };

  const { data: last } = await supabase
    .from("tags")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("tags")
    .insert({ name, slug, description: text(formData, "description"), position: (last?.position ?? -1) + 1 });
  if (error) {
    return { error: error.code === "23505" ? "Tag dengan nama itu sudah ada." : "Tagnya gagal dibuat. Coba lagi." };
  }

  refresh();
  return { ok: `Tag "${name}" sudah ada, alamatnya /${slug}.` };
}

/** Nama dan keterangan bisa diubah; alamatnya (slug) tetap supaya tautan lama tidak putus. */
export async function updateTag(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const name = text(formData, "name");
  if (!id) return { error: "Tagnya tidak ditemukan." };
  if (!name) return { error: "Nama tagnya diisi dulu." };

  const { error } = await supabase.from("tags").update({ name, description: text(formData, "description") }).eq("id", id);
  if (error) return { error: error.code === "23505" ? "Tag dengan nama itu sudah ada." : "Gagal menyimpan. Coba lagi." };

  refresh();
  return { ok: "Tersimpan." };
}

/** Menghapus tag hanya melepasnya dari tulisan; tulisannya sendiri tidak ikut terhapus. */
export async function deleteTag(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;

  await supabase.from("tags").delete().eq("id", id);
  refresh();
}

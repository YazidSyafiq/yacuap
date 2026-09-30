"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

// batas panjang ocehan, sama dengan batas di tabel celotehan (bukan export: file "use server" hanya boleh mengekspor fungsi)
const MAX_LENGTH = 140;

function body(formData: FormData) {
  return String(formData.get("body") ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ocehan tampil di beranda (bagian Ocehan dan balon di hero), jadi berandanya disegarkan. */
function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/ocehan");
}

export async function createQuip(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const text = body(formData);
  if (!text) return { error: "Ocehannya diisi dulu." };
  if (text.length > MAX_LENGTH) return { error: `Kepanjangan. Maksimal ${MAX_LENGTH} karakter, ini ${text.length}.` };

  const { error } = await supabase.from("celotehan").insert({ body: text });
  if (error) return { error: "Ocehannya gagal disimpan. Coba lagi." };

  refresh();
  return { ok: "Masuk. Sebentar lagi nongol di beranda." };
}

export async function updateQuip(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const text = body(formData);
  if (!id) return { error: "Ocehannya tidak ditemukan." };
  if (!text) return { error: "Ocehannya diisi dulu." };
  if (text.length > MAX_LENGTH) return { error: `Kepanjangan. Maksimal ${MAX_LENGTH} karakter, ini ${text.length}.` };

  const { error } = await supabase.from("celotehan").update({ body: text }).eq("id", id);
  if (error) return { error: "Ocehannya gagal disimpan. Coba lagi." };

  refresh();
  return { ok: "Tersimpan." };
}

export async function deleteQuip(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("celotehan").delete().eq("id", id);
  refresh();
}

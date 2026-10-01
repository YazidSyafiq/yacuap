"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { toMonochromeWebp } from "@/lib/images";
import { buildTrackArtwork, fetchYoutubeInfo, parseYoutubeId } from "@/lib/youtube";

export type SaveState = { error?: string; savedAt?: string; slug?: string } | undefined;
export type UploadResult = { url: string; path: string } | { error: string };

const RESERVED = new Set(["baru"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Tulisan tampil di beranda, daftar, halaman tag, dan halaman bacanya: segarkan semuanya. */
function refresh() {
  revalidatePath("/", "layout");
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function coverPublicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${path}`;
}

/** Tulisan baru: dibuat sebagai draf kosong, lalu langsung dibuka di editor. */
export async function createDraft() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("posts")
    .insert({ title: "", slug: `draf-${Date.now().toString(36)}`, status: "draft" })
    .select("id")
    .single();
  if (error || !data) throw new Error("Draf baru gagal dibuat.");
  redirect(`/admin/tulisan/${data.id}`);
}

/**
 * Menyimpan tulisan dari editor: judul, alamat, ringkasan, isi (JSON dan HTML), tag, status.
 * Dipanggil oleh tombol Simpan dan oleh simpan otomatis.
 */
export async function savePost(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return { error: "Tulisannya tidak ditemukan." };

  const title = text(formData, "title").slice(0, 200);
  const status = text(formData, "status") === "published" ? "published" : "draft";
  if (status === "published" && !title) return { error: "Judulnya diisi dulu sebelum terbit." };

  // alamat: dari isian, atau dari judul; harus unik dan tidak memakai kata yang dipakai halaman admin
  let slug = slugify(text(formData, "slug")) || slugify(title) || `draf-${id.slice(0, 8)}`;
  if (RESERVED.has(slug)) slug = `${slug}-tulisan`;
  const { data: clash } = await supabase.from("posts").select("id").eq("slug", slug).neq("id", id).maybeSingle();
  if (clash) {
    if (status === "published") return { error: `Alamat "${slug}" sudah dipakai tulisan lain. Ganti alamatnya.` };
    slug = `${slug}-${id.slice(0, 4)}`;
  }

  const contentHtml = String(formData.get("content_html") ?? "");
  let content: unknown = { type: "doc", content: [] };
  try {
    content = JSON.parse(String(formData.get("content_json") ?? "") || "{}");
  } catch {
    return { error: "Isi tulisannya rusak, tidak bisa disimpan." };
  }
  const words = contentHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(words / 200));

  const { data: current } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
  const publishedAt = status === "published" ? (current?.published_at ?? new Date().toISOString()) : (current?.published_at ?? null);

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      slug,
      excerpt: text(formData, "excerpt").slice(0, 300),
      content,
      content_html: contentHtml,
      status,
      published_at: publishedAt,
      reading_time: readingTime,
    })
    .eq("id", id);
  if (error) return { error: "Gagal menyimpan. Coba lagi." };

  // tag: hapus relasi lama, pasang yang dipilih
  const tagIds = formData.getAll("tags").map(String).filter(Boolean);
  await supabase.from("post_tags").delete().eq("post_id", id);
  if (tagIds.length > 0) {
    await supabase.from("post_tags").insert(tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })));
  }

  refresh();
  return { savedAt: new Date().toISOString(), slug };
}

/** Mengunggah cover tulisan: dijadikan hitam putih, disimpan, dan langsung dipasang ke tulisannya. */
export async function uploadCover(formData: FormData): Promise<UploadResult> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const file = formData.get("file");
  if (!id || !(file instanceof File)) return { error: "Filenya tidak terkirim." };

  const result = await toMonochromeWebp(file, 1600);
  if ("error" in result) return result;

  const path = `posts/${id}/cover-${Date.now().toString(36)}.webp`;
  const { error } = await supabase.storage
    .from("covers")
    .upload(path, result.buffer, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
  if (error) return { error: "Covernya gagal diunggah. Coba lagi." };

  await supabase.from("posts").update({ cover_path: path }).eq("id", id);
  refresh();
  return { url: coverPublicUrl(path), path };
}

/** Melepas cover dari tulisan (filenya dibiarkan, tidak apa-apa). */
export async function removeCover(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;
  await supabase.from("posts").update({ cover_path: null }).eq("id", id);
  refresh();
}

/** Mengunggah gambar di dalam isi tulisan: hitam putih juga, dikembalikan alamatnya untuk disisipkan editor. */
export async function uploadInlineImage(formData: FormData): Promise<UploadResult> {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const file = formData.get("file");
  if (!id || !(file instanceof File)) return { error: "Filenya tidak terkirim." };

  const result = await toMonochromeWebp(file, 1400);
  if ("error" in result) return result;

  const path = `posts/${id}/${Date.now().toString(36)}.webp`;
  const { error } = await supabase.storage
    .from("covers")
    .upload(path, result.buffer, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) return { error: "Gambarnya gagal diunggah. Coba lagi." };

  return { url: coverPublicUrl(path), path };
}

/** Menerbitkan atau menarik tulisan jadi draf dari daftar. Tanggal terbit diisi saat pertama kali terbit. */
export async function setPostStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || (status !== "published" && status !== "draft")) return;

  const { data } = await supabase.from("posts").select("published_at, title").eq("id", id).maybeSingle();
  if (status === "published" && !data?.title) return;
  const publishedAt = status === "published" ? (data?.published_at ?? new Date().toISOString()) : (data?.published_at ?? null);

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

export type TrackResult =
  | { track: { id: string; youtubeId: string; title: string; artist: string; artwork: string | null } }
  | { error: string };

/**
 * Lagu untuk disisipkan ke dalam tulisan, dari tautan YouTube. Lagunya masuk ke tabel `tracks`
 * (dipakai bersama dengan playlist), jadi kalau sudah pernah ada tinggal dipakai lagi.
 */
export async function createTrackFromUrl(_prev: TrackResult | undefined, formData: FormData): Promise<TrackResult> {
  const { supabase } = await requireAdmin();
  const youtubeId = parseYoutubeId(text(formData, "url"));
  if (!youtubeId) return { error: "Tautannya bukan tautan video YouTube." };

  const { data: existing } = await supabase.from("tracks").select("id, title, artist, youtube_id, artwork_path").eq("youtube_id", youtubeId).maybeSingle();
  if (existing) {
    return {
      track: { id: existing.id, youtubeId, title: existing.title, artist: existing.artist, artwork: existing.artwork_path ? coverPublicUrl(existing.artwork_path) : null },
    };
  }

  const info = await fetchYoutubeInfo(youtubeId);
  if (!info) return { error: "Videonya tidak ketemu, atau tidak boleh ditampilkan di luar YouTube." };

  let artworkPath: string | null = null;
  const artwork = await buildTrackArtwork(youtubeId);
  if (artwork) {
    const path = `tracks/${youtubeId}.webp`;
    const { error } = await supabase.storage.from("covers").upload(path, artwork, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (!error) artworkPath = path;
  }

  const { data: created, error } = await supabase
    .from("tracks")
    .insert({ title: info.title, artist: info.artist, youtube_id: youtubeId, artwork_path: artworkPath })
    .select("id")
    .single();
  if (error || !created) return { error: "Lagunya gagal disimpan. Coba lagi." };

  return { track: { id: created.id, youtubeId, title: info.title, artist: info.artist, artwork: artworkPath ? coverPublicUrl(artworkPath) : null } };
}

/** Menghapus komentar pembaca dari halaman editor. */
export async function deleteComment(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return;
  await supabase.from("comments").delete().eq("id", id);
  refresh();
}

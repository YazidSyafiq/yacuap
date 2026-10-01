import { getSharePost, type ShareRatio } from "@/lib/share/data";
import { renderShare } from "@/lib/share/render";

/**
 * Satu kartu bagikan sebagai PNG.
 * /api/share/[slug]?rasio=4x5|9x16&n=nomor urut (mulai 0: judul, kutipan-kutipan, isi, penutup)
 * /api/share/[slug]?jenis=og untuk gambar pratinjau tautan.
 * Hanya untuk tulisan yang sudah terbit.
 */
export async function GET(request: Request, context: RouteContext<"/api/share/[slug]">) {
  const { slug } = await context.params;
  const params = new URL(request.url).searchParams;
  const kind = params.get("jenis") === "og" ? "og" : "urut";
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const index = Number.parseInt(params.get("n") ?? "0", 10) || 0;

  const post = await getSharePost(slug);
  if (!post) return new Response("Tulisannya tidak ditemukan.", { status: 404 });

  try {
    const image = await renderShare(post, kind, ratio, index);
    if (!image) return new Response("Gambarnya tidak ada untuk tulisan ini.", { status: 404 });
    // kartu mengikuti isi tulisan, jadi disimpan sebentar saja
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

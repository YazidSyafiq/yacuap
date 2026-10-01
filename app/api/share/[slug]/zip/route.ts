import { getSharePost, shareFileName, shareSequence, type ShareRatio } from "@/lib/share/data";
import { renderShare } from "@/lib/share/render";
import { createZip, type ZipEntry } from "@/lib/zip";

/**
 * Semua gambar sebuah tulisan dalam satu zip, untuk satu rasio, dengan nama berurutan sesuai urutan unggah:
 * 01-judul.png, 02-kutipan.png, 03-isi.png, ..., NN-penutup.png.
 * /api/share/[slug]/zip?rasio=4x5|9x16
 */
export async function GET(request: Request, context: RouteContext<"/api/share/[slug]/zip">) {
  const { slug } = await context.params;
  const ratio: ShareRatio = new URL(request.url).searchParams.get("rasio") === "9x16" ? "9x16" : "4x5";

  const post = await getSharePost(slug);
  if (!post) return new Response("Tulisannya tidak ditemukan.", { status: 404 });

  try {
    const entries: ZipEntry[] = [];
    const sequence = shareSequence(post);
    for (let i = 0; i < sequence.length; i += 1) {
      const image = await renderShare(post, "urut", ratio, i);
      if (image) entries.push({ name: shareFileName(sequence[i], i), data: new Uint8Array(await image.arrayBuffer()) });
    }

    const zip = createZip(entries);
    const platform = ratio === "9x16" ? "tiktok" : "instagram";
    return new Response(zip.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${post.slug}-${platform}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Zip-nya gagal dibuat.", { status: 500 });
  }
}

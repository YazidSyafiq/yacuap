import { getPlaylistById } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { playlistPageCount, renderPlaylistPage, type ChartStyle } from "@/lib/share/render";
import { createZip, type ZipEntry } from "@/lib/zip";

/**
 * Semua halaman kartu playlist dalam satu zip untuk satu rasio dan gaya: 01-<slug>-<gaya>.png, 02-..., dan seterusnya.
 * /api/playlist/[id]/zip?rasio=4x5|9x16&gaya=koran|tiket
 */
export async function GET(request: Request, context: RouteContext<"/api/playlist/[id]/zip">) {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Playlistnya tidak ditemukan.", { status: 404 });

  const playlist = await getPlaylistById(id);
  if (!playlist) return new Response("Playlistnya tidak ditemukan.", { status: 404 });

  try {
    const entries: ZipEntry[] = [];
    for (let page = 0; page < playlistPageCount(playlist); page += 1) {
      const image = await renderPlaylistPage(playlist, page, ratio, style);
      if (image) entries.push({ name: `${String(page + 1).padStart(2, "0")}-${playlist.slug}-${style}.png`, data: new Uint8Array(await image.arrayBuffer()) });
    }
    const zip = createZip(entries);
    const platform = ratio === "9x16" ? "tiktok" : "instagram";
    return new Response(zip.buffer as ArrayBuffer, {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="playlist-${playlist.slug}-${style}-${platform}.zip"`, "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Zip-nya gagal dibuat.", { status: 500 });
  }
}

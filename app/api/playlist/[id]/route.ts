import { getPlaylistById } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { renderPlaylistPage, type ChartStyle } from "@/lib/share/render";

/**
 * Kartu bagikan satu playlist sebagai PNG, sepuluh lagu per halaman, gaya koran atau tiket. Hanya untuk playlist yang terbit.
 * /api/playlist/[id]?rasio=4x5|9x16&n=nomor halaman (mulai 0)&gaya=koran|tiket
 */
export async function GET(request: Request, context: RouteContext<"/api/playlist/[id]">) {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const page = Number.parseInt(params.get("n") ?? "0", 10) || 0;
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Playlistnya tidak ditemukan.", { status: 404 });

  const playlist = await getPlaylistById(id);
  if (!playlist) return new Response("Playlistnya tidak ditemukan.", { status: 404 });

  try {
    const image = await renderPlaylistPage(playlist, page, ratio, style);
    if (!image) return new Response("Halamannya tidak ada.", { status: 404 });
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

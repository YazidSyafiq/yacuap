import { getPlaylistById } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { renderTrackCard, type ChartStyle } from "@/lib/share/render";

/**
 * Kartu bagikan satu lagu dari sebuah playlist sebagai PNG, gaya koran atau tiket. Hanya untuk playlist yang terbit.
 * /api/playlist/[id]/lagu/[trackId]?rasio=4x5|9x16&gaya=koran|tiket
 */
export async function GET(request: Request, context: RouteContext<"/api/playlist/[id]/lagu/[trackId]">) {
  const { id, trackId } = await context.params;
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(id) || !uuid.test(trackId)) return new Response("Lagunya tidak ditemukan.", { status: 404 });

  const playlist = await getPlaylistById(id);
  if (!playlist) return new Response("Playlistnya tidak ditemukan.", { status: 404 });

  try {
    const image = await renderTrackCard(playlist, trackId, ratio, style);
    if (!image) return new Response("Lagunya tidak ada di playlist ini.", { status: 404 });
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

import { getChart } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { renderTrackCard, type ChartStyle } from "@/lib/share/render";

/**
 * Kartu bagikan satu lagu dari chart minggu ini sebagai PNG, gaya koran atau tiket.
 * /api/chart/lagu/[id]?rasio=4x5|9x16&gaya=koran|tiket
 */
export async function GET(request: Request, context: RouteContext<"/api/chart/lagu/[id]">) {
  const { id } = await context.params;
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Lagunya tidak ada di chart.", { status: 404 });

  const chart = await getChart();
  if (!chart) return new Response("Chart-nya masih kosong.", { status: 404 });

  try {
    const image = await renderTrackCard(chart, id, ratio, style);
    if (!image) return new Response("Lagunya tidak ada di chart.", { status: 404 });
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

import { getChart } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { renderChartPage, type ChartStyle } from "@/lib/share/render";

/**
 * Kartu bagikan chart minggu ini sebagai PNG bergaya koran, sepuluh lagu per halaman.
 * /api/chart?rasio=4x5|9x16&n=nomor halaman (mulai 0)&gaya=koran|tiket
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const page = Number.parseInt(params.get("n") ?? "0", 10) || 0;
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  const chart = await getChart();
  if (!chart) return new Response("Chart-nya masih kosong.", { status: 404 });

  try {
    const image = await renderChartPage(chart, page, ratio, style);
    if (!image) return new Response("Halamannya tidak ada.", { status: 404 });
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

import { getChart } from "@/lib/playlist";
import type { ShareRatio } from "@/lib/share/data";
import { chartPageCount, renderChartPage, type ChartStyle } from "@/lib/share/render";
import { createZip, type ZipEntry } from "@/lib/zip";

/**
 * Semua halaman kartu chart dalam satu zip untuk satu rasio: 01-chart.png, 02-chart.png, ...
 * /api/chart/zip?rasio=4x5|9x16&gaya=koran|tiket
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ratio: ShareRatio = params.get("rasio") === "9x16" ? "9x16" : "4x5";
  const style: ChartStyle = params.get("gaya") === "tiket" ? "tiket" : "koran";
  const chart = await getChart();
  if (!chart) return new Response("Chart-nya masih kosong.", { status: 404 });

  try {
    const entries: ZipEntry[] = [];
    for (let page = 0; page < chartPageCount(chart); page += 1) {
      const image = await renderChartPage(chart, page, ratio, style);
      if (image) entries.push({ name: `${String(page + 1).padStart(2, "0")}-chart-${style}.png`, data: new Uint8Array(await image.arrayBuffer()) });
    }
    const zip = createZip(entries);
    const platform = ratio === "9x16" ? "tiktok" : "instagram";
    return new Response(zip.buffer as ArrayBuffer, {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="chart-minggu-ini-${style}-${platform}.zip"`, "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Zip-nya gagal dibuat.", { status: 500 });
  }
}

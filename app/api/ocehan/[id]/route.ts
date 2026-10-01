import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShareRatio } from "@/lib/share/data";
import { renderQuip } from "@/lib/share/render";

/**
 * Kartu bagikan satu ocehan sebagai PNG, bergaya kartu kutipan.
 * /api/ocehan/[id]?rasio=4x5|9x16
 * Hanya untuk ocehan yang terbit.
 */
export async function GET(request: Request, context: RouteContext<"/api/ocehan/[id]">) {
  const { id } = await context.params;
  const ratio: ShareRatio = new URL(request.url).searchParams.get("rasio") === "9x16" ? "9x16" : "4x5";
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Ocehannya tidak ditemukan.", { status: 404 });

  const { data, error } = await createPublicClient().from("celotehan").select("body").eq("id", id).eq("status", "published").maybeSingle();
  if (error || !data) return new Response("Ocehannya tidak ditemukan.", { status: 404 });

  try {
    const image = await renderQuip(String(data.body), ratio);
    image.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return image;
  } catch {
    return new Response("Gambarnya gagal dibuat.", { status: 500 });
  }
}

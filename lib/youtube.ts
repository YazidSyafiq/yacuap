import "server-only";
import sharp from "sharp";

/** Mengambil ID video (11 karakter) dari berbagai bentuk alamat YouTube, atau dari ID-nya langsung. */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, rest] = url.pathname.split("/");
      if (kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") id = rest ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

// embel-embel di judul video yang bukan bagian dari judul lagu
const NOISE = /\s*[([][^)\]]*(official|video|audio|lyric|lirik|visuali[sz]er|mv|hd|4k|remaster)[^)\]]*[)\]]/gi;

function tidy(text: string) {
  return text.replace(NOISE, "").replace(/\s+/g, " ").trim();
}

/**
 * Judul dan artis dari oEmbed YouTube (tanpa API key).
 * Judul video sering berbentuk "Artis - Judul (Official Video)", jadi dirapikan sebisanya;
 * hasilnya tetap bisa diedit manual di admin.
 */
export async function fetchYoutubeInfo(youtubeId: string): Promise<{ title: string; artist: string } | null> {
  const target = encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`);
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${target}&format=json`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string };
    const rawTitle = String(data.title ?? "").trim();
    const channel = String(data.author_name ?? "")
      .replace(/\s*-\s*Topic$/i, "")
      .replace(/VEVO$/i, "")
      .trim();
    const parts = rawTitle.split(/\s+[-–—]\s+/);
    if (parts.length >= 2) {
      return { artist: tidy(parts[0]), title: tidy(parts.slice(1).join(" - ")) || rawTitle };
    }
    return { title: tidy(rawTitle) || rawTitle, artist: channel };
  } catch {
    return null;
  }
}

const THUMBNAILS = ["maxresdefault", "sddefault", "hqdefault"];

/**
 * Sampul lagu dari thumbnail YouTube: dipotong persegi di tengah, dijadikan hitam putih, lalu jadi WebP.
 * Thumbnail 4:3 punya pita hitam di atas dan bawah, jadi sisi perseginya dihitung dari area 16:9-nya.
 * Mengembalikan null kalau thumbnailnya tidak bisa diambil.
 */
export async function buildTrackArtwork(youtubeId: string): Promise<Buffer | null> {
  for (const name of THUMBNAILS) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${youtubeId}/${name}.jpg`, { cache: "no-store" });
      if (!res.ok) continue;
      const input = Buffer.from(await res.arrayBuffer());
      const { width, height } = await sharp(input).metadata();
      if (!width || !height || width < 200) continue;
      const side = Math.min(height, Math.round((width * 9) / 16));
      return await sharp(input)
        .extract({
          left: Math.round((width - side) / 2),
          top: Math.round((height - side) / 2),
          width: side,
          height: side,
        })
        .resize(480, 480)
        .grayscale()
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      continue;
    }
  }
  return null;
}

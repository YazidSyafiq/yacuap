import "server-only";
import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif", "image/gif"]);

/**
 * Pipeline gambar situs: semua gambar yang diunggah (cover, gambar di dalam tulisan) lewat sini.
 * Diperkecil ke lebar maksimal, dijadikan hitam putih, lalu WebP. Tidak ada jalur unggah yang melewati ini.
 * Mengembalikan pesan galat (bukan melempar) supaya bisa ditampilkan ke admin apa adanya.
 */
export async function toMonochromeWebp(file: File, maxWidth: number): Promise<{ buffer: Buffer } | { error: string }> {
  if (!file || file.size === 0) return { error: "Filenya kosong." };
  if (file.size > MAX_BYTES) return { error: "Filenya kegedean. Maksimal 10 MB." };
  if (file.type && !ALLOWED.has(file.type)) return { error: "Formatnya bukan gambar (JPG, PNG, WebP, AVIF, HEIC)." };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const buffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .grayscale()
      .webp({ quality: 84 })
      .toBuffer();
    return { buffer };
  } catch {
    return { error: "Gambarnya nggak bisa dibaca. Coba format lain." };
  }
}

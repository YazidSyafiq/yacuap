/**
 * Memotong gambar penulis dari latarnya untuk bagian "Oknumnya".
 *
 *   node scripts/potong-gambar-oknum.cjs
 *
 * Sumber: docs/its me.png (gambar hitam putih di atas latar putih dengan bayangan).
 * Hasil:  public/oknum/yazid.png        untuk mode terang, latar transparan
 *         public/oknum/yazid-gelap.png  untuk mode gelap, dengan garis tepi terang seperti stiker
 *
 * Caranya: garis hitam dianggap dinding. Dari tepi gambar, area putih "dibanjiri" sampai mentok garis.
 * Yang kebanjiran itu latar (jadi transparan); putih yang terkurung garis, seperti wajah dan tangan, tetap ada.
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "docs", "its me.png");
const OUT_DIR = path.join(__dirname, "..", "public", "oknum");
const INK_BELOW = 150; // lebih gelap dari ini dianggap garis
const HALO = { r: 237, g: 237, b: 237 };
const MAX_HEIGHT = 900;

/** Melebarkan (grow) atau mengikis (shrink) area bernilai 1 sebanyak satu piksel. */
function morph(mask, width, height, grow) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let hit = grow ? 0 : 1;
      for (let dy = -1; dy <= 1 && hit === (grow ? 0 : 1); dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          const value = nx < 0 || ny < 0 || nx >= width || ny >= height ? 0 : mask[ny * width + nx];
          if (grow && value) hit = 1;
          if (!grow && !value) hit = 0;
        }
      }
      out[y * width + x] = hit;
    }
  }
  return out;
}

async function main() {
  const source = sharp(SRC).removeAlpha();
  // jumlah kanal dipaksa: 1 untuk abu-abu, 3 untuk warna, apa pun format file aslinya
  const grayRaw = await source.clone().toColourspace("b-w").raw().toBuffer({ resolveWithObject: true });
  const rgbRaw = await source.clone().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const { width, height } = grayRaw.info;
  if (grayRaw.info.channels !== 1 || rgbRaw.info.channels !== 3) {
    throw new Error(`Kanal tidak sesuai: abu ${grayRaw.info.channels}, warna ${rgbRaw.info.channels}`);
  }
  const gray = grayRaw.data;
  const rgb = rgbRaw.data;

  // dinding: garis hitam, dilebarkan 1px supaya celah kecil di garis tertutup
  let wall = new Uint8Array(width * height);
  for (let i = 0; i < wall.length; i++) wall[i] = gray[i] < INK_BELOW ? 1 : 0;
  wall = morph(wall, width, height, true);

  // banjiri dari tepi
  const outside = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    const i = y * width + x;
    if (!wall[i] && !outside[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }

  // gambar = semua yang tidak kebanjiran, dikikis 1px untuk membuang sisa putih di luar garis
  let inside = new Uint8Array(width * height);
  for (let i = 0; i < inside.length; i++) inside[i] = outside[i] ? 0 : 1;
  inside = morph(inside, width, height, false);

  const mask = Buffer.alloc(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = inside[i] ? 255 : 0;
  // tepi dihaluskan sedikit supaya tidak bergerigi
  const alpha = await sharp(mask, { raw: { width, height, channels: 1 } }).blur(0.7).extractChannel(0).raw().toBuffer(); // sharp mengembalikan 3 kanal setelah blur; ambil satu

  const cut = await sharp(rgb, { raw: { width, height, channels: 3 } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // versi gelap: siluet dilebarkan lalu diwarnai terang, gambar asli di atasnya.
  // Digabung piksel demi piksel di sini supaya hasilnya pasti, tidak bergantung cara sharp menumpuk lapisan.
  // Dua tahap terpisah: sharp hanya memakai satu nilai blur per rangkaian, jadi pelebaran dan penghalusan
  // tidak bisa digabung dalam satu rangkaian.
  const widened = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(9)
    .threshold(16)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const haloAlpha = await sharp(widened, { raw: { width, height, channels: 1 } })
    .blur(0.9)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const darkRaw = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const a = alpha[i] / 255;
    darkRaw[i * 4] = Math.round(rgb[i * 3] * a + HALO.r * (1 - a));
    darkRaw[i * 4 + 1] = Math.round(rgb[i * 3 + 1] * a + HALO.g * (1 - a));
    darkRaw[i * 4 + 2] = Math.round(rgb[i * 3 + 2] * a + HALO.b * (1 - a));
    darkRaw[i * 4 + 3] = Math.max(alpha[i], haloAlpha[i]);
  }
  const dark = await sharp(darkRaw, { raw: { width, height, channels: 4 } }).png().toBuffer();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, buffer] of [["yazid.png", cut], ["yazid-gelap.png", dark]]) {
    const out = path.join(OUT_DIR, name);
    const trimmed = await sharp(buffer).trim({ threshold: 1 }).toBuffer();
    const info = await sharp(trimmed)
      .resize({ height: MAX_HEIGHT, withoutEnlargement: true })
      .png({ palette: true, colors: 64, compressionLevel: 9 })
      .toFile(out);
    console.log(`${info.width} x ${info.height}px -> ${path.relative(process.cwd(), out)} (${Math.round(info.size / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

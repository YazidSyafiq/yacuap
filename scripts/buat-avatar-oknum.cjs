// Avatar penulis untuk halaman baca: gambar di bagian Oknumnya, utuh di dalam lingkaran.
// Versi hitam memakai garis tepi putih tebal seperti stiker (sama dengan gambar aslinya di docs/its me.png).
// Jalankan: node scripts/buat-avatar-oknum.cjs
const sharp = require("sharp");

const OUTLINE = 30; // tebal garis tepi stiker, dalam piksel gambar sumber

(async () => {
  // gambar potongan (latar transparan), diberi ruang di sekelilingnya untuk garis tepi
  const figure = await sharp("public/oknum/yazid.png")
    .ensureAlpha()
    .extend({ top: OUTLINE * 2, bottom: OUTLINE * 2, left: OUTLINE * 2, right: OUTLINE * 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const { width, height } = await sharp(figure).metadata();

  // siluet yang ditebalkan: alfa dikaburkan lalu diambang, hasilnya bentuk gambar yang melebar OUTLINE piksel
  const mask = await sharp(figure)
    .extractChannel(3)
    .blur(OUTLINE / 2)
    .threshold(12)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const sticker = await sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .joinChannel(mask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  // Kanvas persegi selebar diagonal gambar, supaya seluruh stiker masuk ke dalam lingkaran avatar.
  const side = Math.ceil(Math.hypot(width, height) * 1.02);
  // Dua versi, kebalikan dari tema: lingkaran hitam untuk mode terang, lingkaran abu terang untuk mode gelap (putih polos terlalu mencolok).

  const versions = [
    { out: "public/oknum/penulis-hitam.png", background: "#111111", layers: [sticker, figure] },
    { out: "public/oknum/penulis-abu.png", background: "#d4d4d4", layers: [sticker, figure] },
  ];
  for (const version of versions) {
    const canvas = await sharp({ create: { width: side, height: side, channels: 3, background: version.background } })
      .composite(version.layers.map((input) => ({ input, gravity: "centre" })))
      .png()
      .toBuffer();
    await sharp(canvas).resize(256, 256).png().toFile(version.out);
    console.log(version.out);
  }
})();

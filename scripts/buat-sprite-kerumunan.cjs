/**
 * Membuat sprite kerumunan seluruh badan (dengan kaki) untuk hero.
 *
 *   node scripts/buat-sprite-kerumunan.cjs
 *
 * Sumber gambar: Open Peeps karya Pablo Stanley (CC0), lewat paket react-peeps (MIT).
 * Tiap sosok dirakit acak dari pose berdiri, rambut, wajah, kumis/janggut, dan kacamata,
 * dengan angka acak berbenih supaya hasilnya selalu sama tiap kali dijalankan.
 *
 * Hasilnya dua file: kerumunan.png (mode terang) dan kerumunan-gelap.png (mode gelap, dengan garis tepi terang).
 *
 * Sosok pertama (indeks 0) adalah "tuan rumah": Yazid di tengah kerumunan.
 * Ubah HOST di bawah kalau mau ganti tampangnya.
 */
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const peeps = require("react-peeps");
const sharp = require("sharp");

const Peep = peeps.default;
const OUT_DIR = path.join(__dirname, "..", "public", "hero");
const PER_ROW = 14;
const ROWS = 6;
const CELL_W = 240;
const CELL_H = 480;
const INK = "#111111";
const PAPER = "#ffffff";
// Ruang kosong di bawah kaki, supaya garis tepi versi gelap tidak terpotong dasar sel.
const FOOT_PAD = 5;
// Versi gelap: orangnya sama persis, ditambah garis tepi terang seperti stiker,
// supaya rambut dan baju hitam tetap terlihat di latar gelap.
const HALO = { r: 237, g: 237, b: 237 };
const HALO_BLUR = 2.2;

// Bidang gambar yang cukup untuk pose paling lebar dan rambut paling tinggi.
const VIEW = { x: -400, y: -300, width: 1900, height: 3400 };
const PX_PER_UNIT = (CELL_H - 8 - FOOT_PAD) / VIEW.height;

const HOST = { body: "WalkingWB", face: "Explaining", hair: "ShortVolumed", facialHair: "None", accessory: "None" };

// [nama, bobot]. Pose berjalan paling sering muncul.
const BODIES = [
  ["WalkingWB", 5], ["WalkingBW", 5], ["WalkingFilled", 3],
  ["ShirtPantsWB", 3], ["ShirtPantsBW", 3], ["ShirtWB", 2], ["ShirtBW", 2],
  ["BlazerPantsWB", 2], ["BlazerPantsBW", 2], ["BlazerWB", 1], ["BlazerBW", 1],
  ["EasingWB", 2], ["EasingBW", 2], ["CrossedArmsWB", 1], ["CrossedArmsBW", 1],
  ["RestingWB", 1], ["RestingBW", 1], ["PointingFingerWB", 1], ["PointingFingerBW", 1],
  ["PolkaDots", 2], ["RoboDanceWB", 1], ["RoboDanceBW", 1],
];
const FACES = [
  ["Smile", 4], ["Calm", 4], ["Cute", 3], ["Cheeky", 3], ["SmileBig", 3], ["SmileLol", 2], ["SmileTeeth", 2],
  ["Explaining", 3], ["Awe", 2], ["Driven", 2], ["Serious", 2], ["Solemn", 2], ["Suspicious", 2], ["Tired", 2],
  ["Concerned", 2], ["Contempt", 1], ["EyesClosed", 2], ["Blank", 2], ["OldAged", 1], ["EatingHappy", 1],
  ["LoveGrin", 1], ["Hectic", 1], ["Angry", 1], ["Cyclops", 1], ["Monster", 1],
];
const HAIRS = [
  "Afro", "Bald", "BaldSides", "BaldTop", "Bangs", "BangsFilled", "Bun", "BunCurly", "Buns", "FlatTop",
  "FlatTopLong", "HatHip", "Long", "LongAfro", "LongBangs", "LongCurly", "Medium", "MediumBangs",
  "MediumBangsFilled", "MediumLong", "MediumShort", "MediumStraight", "Mohawk", "Pomp", "ShavedRight",
  "ShavedSides", "ShavedWavy", "Short", "ShortCurly", "ShortMessy", "ShortScratch", "ShortVolumed", "ShortWavy",
  "BantuKnots", "Beanie", "BunFancy", "CornRows", "CornRowsFilled", "GrayBun", "GrayMedium", "GrayShort",
  "Hijab", "MediumShade", "Turban", "Twists", "TwistsVolumed",
].map((name) => [name, 1]);
const FACIAL_HAIR = [
  ["None", 22], ["Chin", 1], ["Full", 2], ["FullMedium", 2], ["Goatee", 1], ["GoateeCircle", 1], ["Dali", 1],
  ["Handlebars", 1], ["Imperial", 1], ["Painters", 1], ["Swashbuckler", 1], ["MoustacheThin", 2], ["Yosemite", 1],
  ["GrayFull", 1], ["FullMajestic", 1],
];
const ACCESSORIES = [
  ["None", 20], ["GlassRoundThick", 2], ["GlassRound", 2], ["GlassAviator", 1], ["GlassButterfly", 1],
  ["GlassClubmaster", 1], ["SunglassClubmaster", 2], ["SunglassWayfarer", 2], ["Eyepatch", 1],
];
// rambut yang tidak cocok dipasangkan dengan kumis atau janggut
const NO_FACIAL_HAIR = new Set(["Hijab", "Bun", "BunCurly", "Buns", "BunFancy", "GrayBun", "LongBangs", "Bangs", "BangsFilled"]);

// mulberry32: angka acak berbenih
function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = createRandom(20260930);
function pick(weighted) {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [name, weight] of weighted) {
    roll -= weight;
    if (roll <= 0) return name;
  }
  return weighted[weighted.length - 1][0];
}

function randomLook() {
  const hair = pick(HAIRS);
  return {
    body: pick(BODIES),
    face: pick(FACES),
    hair,
    facialHair: NO_FACIAL_HAIR.has(hair) ? "None" : pick(FACIAL_HAIR),
    accessory: pick(ACCESSORIES),
  };
}

/** Satu sosok dalam satu sel. `k` memperbesar semuanya, dipakai untuk potret tuan rumah. */
async function renderCell(look, k = 1) {
  const cellW = CELL_W * k;
  const cellH = CELL_H * k;
  const footPad = FOOT_PAD * k;
  let svg = renderToStaticMarkup(
    React.createElement(Peep, {
      ...look,
      strokeColor: INK,
      backgroundColor: PAPER,
      viewBox: { x: String(VIEW.x), y: String(VIEW.y), width: String(VIEW.width), height: String(VIEW.height) },
    }),
  );
  if (!svg.includes("xmlns=")) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const width = Math.round(VIEW.width * PX_PER_UNIT * k);
  const height = Math.round(VIEW.height * PX_PER_UNIT * k);
  const raster = await sharp(Buffer.from(svg), { density: 300 }).resize({ width, height, fit: "fill" }).png().toBuffer();
  // pangkas ruang kosong, lalu taruh di sel: kaki menempel di dasar sel, badan di tengah
  const trimmed = await sharp(raster).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  let { data, info } = trimmed;
  const maxW = cellW - 12 * k;
  const maxH = cellH - 8 * k - footPad;
  if (info.width > maxW || info.height > maxH) {
    const fitted = await sharp(data).resize({ width: maxW, height: maxH, fit: "inside" }).toBuffer({ resolveWithObject: true });
    data = fitted.data;
    info = fitted.info;
  }
  // satu sel utuh, kaki footPad px di atas dasar sel
  const light = await sharp({ create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: data, left: Math.floor((cellW - info.width) / 2), top: cellH - footPad - info.height }])
    .png()
    .toBuffer();
  return { light, dark: await withHalo(light, cellW, cellH, k) };
}

/** Siluet sosok dilebarkan beberapa piksel dan diwarnai terang, lalu sosok aslinya ditaruh di atasnya. */
async function withHalo(cell, cellW, cellH, k) {
  const alpha = await sharp(cell).extractChannel("alpha").blur(HALO_BLUR * k).threshold(28).toColourspace("b-w").raw().toBuffer();
  const halo = await sharp({ create: { width: cellW, height: cellH, channels: 3, background: HALO } })
    .joinChannel(alpha, { raw: { width: cellW, height: cellH, channels: 1 } })
    .png()
    .toBuffer();
  return sharp(halo).composite([{ input: cell }]).png().toBuffer();
}

async function main() {
  const looks = [HOST];
  const seen = new Set([JSON.stringify(HOST)]);
  while (looks.length < PER_ROW * ROWS) {
    const look = randomLook();
    const key = JSON.stringify(look);
    // tidak ada kembaran, dan tidak ada yang mirip tuan rumah
    if (seen.has(key) || (look.hair === HOST.hair && look.body === HOST.body)) continue;
    seen.add(key);
    looks.push(look);
  }

  const sheets = { light: [], dark: [] };
  for (let i = 0; i < looks.length; i++) {
    const cell = await renderCell(looks[i]);
    const at = { left: (i % PER_ROW) * CELL_W, top: Math.floor(i / PER_ROW) * CELL_H };
    sheets.light.push({ input: cell.light, ...at });
    sheets.dark.push({ input: cell.dark, ...at });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [name, composites] of [["kerumunan.png", sheets.light], ["kerumunan-gelap.png", sheets.dark]]) {
    const out = path.join(OUT_DIR, name);
    await sharp({ create: { width: PER_ROW * CELL_W, height: ROWS * CELL_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(composites)
      .png({ palette: true, colors: 48, compressionLevel: 9 })
      .toFile(out);
    const { size } = fs.statSync(out);
    console.log(`${looks.length} sosok, ${PER_ROW} x ${ROWS}, sel ${CELL_W} x ${CELL_H}px -> ${path.relative(process.cwd(), out)} (${Math.round(size / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

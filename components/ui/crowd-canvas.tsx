"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Kerumunan orang seluruh badan yang berjalan melintas, digambar di canvas.
 *
 * Ditulis sendiri untuk Yacuap, tanpa pustaka animasi: satu simulasi kecil yang dijalankan tiap frame
 * (requestAnimationFrame). Tiap orang punya posisi, arah, kecepatan, dan irama langkah; posisinya dimajukan
 * sesuai waktu yang berlalu, dan orang yang keluar layar masuk lagi dari tepi sebagai sosok lain.
 *
 * Ilustrasi: Open Peeps karya Pablo Stanley (https://www.openpeeps.com/), lisensi CC0.
 * Sprite dibuat oleh scripts/buat-sprite-kerumunan.cjs; tiap sel sudah rata bawah, jadi dasar sel = telapak kaki.
 *
 * Yang dikerjakan komponen ini:
 * - ukuran orang, balon, dan logo mengikuti lebar layar: besar di monitor, kecil di HP,
 * - langkah: badan naik turun dan sedikit oleng kiri kanan seirama, kecepatan mengikuti tinggi badan,
 * - balon ucapan menempel tepat di atas kepala orang yang membawanya, dengan ekor ke kepalanya,
 * - satu "tuan rumah" yang diam di depan kerumunan dengan balon logo,
 * - berhenti saat tidak terlihat, dan menghormati prefers-reduced-motion,
 * - ikut mode gelap: sprite sendiri (garis tepi terang) dan balon terang, bukan warna yang dibalik.
 */

/** Potongan sprite: x, y, lebar, tinggi di gambar sumber. */
/** Satu sel sprite, plus jarak dari tepi atas sel ke puncak kepala sosoknya (piksel sprite), karena sosok rata bawah dan tingginya beda-beda. */
type Cell = readonly [sx: number, sy: number, sw: number, sh: number, head: number];

type Walker = {
  cell: Cell;
  /** Titik tengah badan, sumbu x. */
  x: number;
  /** Garis tanah tempat kakinya menapak. */
  ground: number;
  direction: 1 | -1;
  /** Piksel per detik. */
  speed: number;
  /** Jumlah langkah yang sudah diambil; bagian pecahannya menentukan posisi badan dalam satu langkah. */
  steps: number;
  /** Langkah per detik. */
  cadence: number;
  /** Isi balon, sudah dipecah per baris; kosong kalau tidak sedang ngomong. */
  lines: string[];
  /** Nomor kalimat di `phrases` yang sedang dibawa, -1 kalau tidak ada. Dipakai supaya kalimat tidak dobel. */
  phrase: number;
  bubbleWidth: number;
  bubbleHeight: number;
  /** Urutan masuk, untuk pengurutan yang stabil. */
  order: number;
};

export type CrowdHost = {
  /** Indeks sosok di sprite (kiri ke kanan, atas ke bawah, mulai 0). */
  index: number;
  /** Gambar di balon tuan rumah untuk mode terang: balonnya hitam, jadi logonya versi putih. */
  bubbleImage: string;
  /** Gambar di balon tuan rumah untuk mode gelap: balonnya terang, jadi logonya versi hitam. */
  bubbleImageDark?: string;
  /** Posisi horizontal 0 sampai 1 di layar lebar. Di layar sempit selalu di tengah. */
  position?: number;
};

type CrowdCanvasProps = {
  /** Sprite sheet berisi orang-orang dalam grid, tiap sel rata bawah. */
  src: string;
  /** Sprite untuk mode gelap: orang yang sama dengan garis tepi terang. Ukuran dan susunannya harus sama. */
  srcDark?: string;
  /** Jumlah orang per baris di sprite. */
  perRow?: number;
  /** Jumlah baris di sprite. */
  rowCount?: number;
  /** Kalimat yang muncul di balon ucapan, ditampilkan utuh dan dipecah per baris kalau panjang. Kosongkan untuk tanpa balon. */
  phrases?: readonly string[];
  /**
   * Peluang seseorang mencoba membawa balon, 0 sampai 1. Balon hanya jadi kalau lintasannya dijamin bebas
   * tabrakan dari ujung ke ujung, jadi jumlah balon yang tampil dibatasi ruang, bukan angka ini.
   */
  bubbleChance?: number;
  /** Pengali keramaian. 1 = bawaan, 0.5 = separuhnya. */
  density?: number;
  /**
   * Ukuran orang mengikuti lebar layar: tinggi = sizeBase + lebar x sizeByWidth,
   * lalu dijepit antara minPeepHeight dan maxPeepHeight.
   * Bawaan: HP 390px sekitar 160px, laptop 1280px sekitar 275px, monitor 1920px sekitar 360px
   * (selama tinggi canvas mengizinkan).
   */
  sizeBase?: number;
  sizeByWidth?: number;
  minPeepHeight?: number;
  maxPeepHeight?: number;
  /** Orang tidak pernah lebih tinggi dari bagian ini dari tinggi canvas. */
  maxHeightFraction?: number;
  /** Tuan rumah: satu sosok yang diam di depan. */
  host?: CrowdHost;
  className?: string;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);
const pickIndex = (length: number) => Math.floor(Math.random() * length);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Laju jalan: bagian tinggi badan yang ditempuh per detik. */
const WALK_SPEED = 0.55;
/** Panjang satu langkah, sebagai bagian dari tinggi badan. */
const STRIDE = 0.25;
/** Badan terangkat paling banyak sebesar ini (bagian tinggi badan) di tengah langkah. */
const LIFT = 0.022;
/** Olengan badan paling besar, dalam radian. */
const LEAN = 0.03;

export function CrowdCanvas({
  src,
  srcDark,
  perRow = 14,
  rowCount = 6,
  phrases = [],
  bubbleChance = 0.85,
  density = 1,
  sizeBase = 110,
  sizeByWidth = 0.13,
  minPeepHeight = 130,
  maxPeepHeight = 460,
  maxHeightFraction = 0.8,
  host,
  className,
}: CrowdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostIndex = host?.index;
  const hostBubbleImage = host?.bubbleImage;
  const hostBubbleImageDark = host?.bubbleImageDark;
  const hostPosition = host?.position ?? 0.72;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fontFamily = getComputedStyle(canvas).fontFamily || "sans-serif";

    // ---------------------------------------------------------------- tema
    const isDark = () => root.getAttribute("data-theme") === "dark";
    const colors = { ink: "#111111", paper: "#ffffff" };
    const sheets: { light: HTMLImageElement; dark: HTMLImageElement | null } = { light: new Image(), dark: null };
    const marks: { light: HTMLImageElement | null; dark: HTMLImageElement | null } = {
      light: hostBubbleImage ? new Image() : null,
      dark: null,
    };
    const ready = (image: HTMLImageElement | null): image is HTMLImageElement =>
      Boolean(image && image.complete && image.naturalWidth > 0);
    // gambar yang sedang dipakai; berganti saat tema berganti
    let sheet = sheets.light;
    let mark = marks.light;

    // ---------------------------------------------------------------- keadaan
    const view = { width: 0, height: 0, dpr: 1 };
    // Ukuran dan garis-garis panggung, dihitung ulang tiap kali canvas berubah ukuran.
    const scene = {
      peepHeight: 0,
      cellScale: 1,
      floor: 0,
      depth: 0,
      font: 12,
      /** Tinggi satu baris teks di balon. */
      lineHeight: 15,
      /** Ruang di dalam balon, kiri kanan atas bawah. */
      bubblePad: 5,
      /** Lebar teks paling besar sebelum dipecah ke baris berikutnya. */
      bubbleMaxWidth: 240,
      /** Jarak dari puncak kepala ke sisi bawah balon: ekor plus celah yang menampung naik turunnya langkah. */
      bubbleGap: 8,
    };
    const cells: Cell[] = [];
    /** Separuh sosok yang kepalanya paling tinggi di selnya, dan separuh yang paling rendah; dipakai pembawa balon. */
    const tallCells: Cell[] = [];
    const shortCells: Cell[] = [];
    let hostCell: Cell | null = null;
    const walkers: Walker[] = [];
    const hostBox = { x: 0, ground: 0, width: 0, height: 0 };
    let arrivals = 0;
    let clock = 0;
    let frameId = 0;
    let lastTime = 0;
    let playing = false;
    let disposed = false;

    const fontCss = () => `600 ${scene.font}px ${fontFamily}`;

    /** Memecah kalimat per kata supaya tiap baris muat di lebar balon. Kata yang kelewat panjang tetap satu baris. */
    const wrap = (text: string, maxWidth: number) => {
      ctx.font = fontCss();
      const lines: string[] = [];
      let line = "";
      for (const word of text.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(next).width > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return lines;
    };

    // ---------------------------------------------------------------- sprite
    const sliceSheet = () => {
      const width = sheets.light.naturalWidth / perRow;
      const height = sheets.light.naturalHeight / rowCount;
      // Puncak kepala tiap sosok diukur dari piksel sprite: baris pertama dari atas yang ada tintanya.
      // Dipakai untuk menempelkan balon tepat di atas kepala, bukan di tepi sel.
      const probe = document.createElement("canvas");
      probe.width = width;
      probe.height = height;
      const probeCtx = probe.getContext("2d", { willReadFrequently: true });
      const headOf = (sx: number, sy: number) => {
        if (!probeCtx) return 0;
        probeCtx.clearRect(0, 0, width, height);
        probeCtx.drawImage(sheets.light, sx, sy, width, height, 0, 0, width, height);
        const alpha = probeCtx.getImageData(0, 0, width, height).data;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x += 2) {
            if (alpha[(y * width + x) * 4 + 3] > 40) return y;
          }
        }
        return 0;
      };
      for (let i = 0; i < perRow * rowCount; i++) {
        const sx = (i % perRow) * width;
        const sy = Math.floor(i / perRow) * height;
        const cell: Cell = [sx, sy, width, height, headOf(sx, sy)];
        // tuan rumah tidak ikut berjalan, supaya tidak ada kembarannya di kerumunan
        if (i === hostIndex) hostCell = cell;
        else cells.push(cell);
      }
      const byHead = [...cells].sort((a, b) => a[4] - b[4]);
      tallCells.push(...byHead.slice(0, Math.ceil(byHead.length / 2)));
      shortCells.push(...byHead.slice(Math.floor(byHead.length / 2)));
    };

    // ---------------------------------------------------------------- orang
    /** Sisi atas balon seseorang: tepat di atas puncak kepalanya, dengan celah untuk ekor. */
    const bubbleTop = (walker: Walker, bubbleHeight: number) =>
      walker.ground - (walker.cell[3] - walker.cell[4]) * scene.cellScale - scene.bubbleGap - bubbleHeight;

    /**
     * Balon tidak pernah hilang-muncul di tengah layar: ia masuk bersama orangnya dari satu sisi dan keluar
     * di sisi lain. Supaya itu bisa dijamin, balon hanya diberikan kalau sepanjang lintasannya tidak akan
     * menabrak balon lain yang sedang ada:
     * - semua pembawa balon jalannya sama cepat, jadi balon searah menjaga jaraknya; cukup dicek jaraknya sekarang,
     * - balon berlawanan arah pasti berpapasan, jadi kotaknya harus terpisah secara vertikal. Supaya hampir
     *   selalu terpisah, pembawa balon ke kanan berdiri di baris paling depan dengan sosok yang lebih pendek
     *   (kepala paling rendah), dan yang ke kiri di baris paling belakang dengan sosok yang lebih tinggi.
     */
    const pathIsClear = (walker: Walker, width: number, height: number) => {
      const top = bubbleTop(walker, height);
      if (top < 4) return false;
      const gap = scene.font * 0.35;
      for (const other of walkers) {
        if (other === walker || other.lines.length === 0) continue;
        const otherTop = bubbleTop(other, other.bubbleHeight);
        const apartY = top + height + gap <= otherTop || otherTop + other.bubbleHeight + gap <= top;
        if (apartY) continue;
        if (other.direction !== walker.direction) return false;
        const apartX = Math.abs(other.x - walker.x) >= (other.bubbleWidth + width) / 2 + gap;
        if (!apartX) return false;
      }
      return true;
    };

    /**
     * Kalimat dibagikan dari satu tumpukan yang dikocok: semua kalimat keluar sekali sebelum ada yang diulang,
     * dan kalimat yang sedang tampil di balon lain tidak pernah diberikan lagi, jadi tidak ada ocehan dobel di layar.
     */
    let deck: number[] = [];
    const inUse = (index: number) => walkers.some((other) => other.phrase === index);
    const drawPhrase = () => {
      for (let tries = 0; tries < phrases.length; tries++) {
        if (deck.length === 0) {
          deck = phrases.map((_, i) => i);
          for (let i = deck.length - 1; i > 0; i--) {
            const j = pickIndex(i + 1);
            [deck[i], deck[j]] = [deck[j], deck[i]];
          }
        }
        const index = deck.pop() as number;
        if (!inUse(index)) return index;
        deck.unshift(index); // masih tampil: kembalikan ke dasar tumpukan
      }
      return -1;
    };

    /** Isi ulang seorang pejalan dengan sosok, arah, kecepatan, dan balon yang baru. */
    const cast = (walker: Walker, atEdge: boolean) => {
      walker.phrase = -1;
      const index = phrases.length > 0 && Math.random() < bubbleChance ? drawPhrase() : -1;
      const phrase = index >= 0 ? phrases[index] : null;
      // pembawa balon jalannya seragam supaya balon searah tidak pernah saling susul
      const pace = phrase ? 1 : between(0.75, 1.3);
      const half = (walker.cell[2] * scene.cellScale) / 2;
      walker.direction = Math.random() < 0.5 ? 1 : -1;
      // calon pembawa balon: ke kanan sosok pendek, ke kiri sosok tinggi (lihat pathIsClear)
      const pool = phrase ? (walker.direction === 1 ? shortCells : tallCells) : cells;
      walker.cell = pool[pickIndex(pool.length)];
      walker.speed = scene.peepHeight * WALK_SPEED * pace;
      walker.cadence = (WALK_SPEED * pace) / STRIDE;
      walker.steps = Math.random() * 2;
      // tersebar dari baris depan sampai belakang, sedikit lebih ramai di depan;
      // calon pembawa balon ke kanan di baris paling depan, ke kiri di baris paling belakang (lihat pathIsClear)
      const depth = phrase ? (walker.direction === 1 ? between(0, 0.06) : between(0.94, 1)) : Math.pow(Math.random(), 1.25);
      walker.ground = scene.floor - scene.depth * depth;
      walker.x = atEdge
        ? walker.direction === 1
          ? -half - between(0, half * 3)
          : view.width + half + between(0, half * 3)
        : between(-half, view.width + half);
      walker.order = arrivals++;
      walker.lines = [];

      if (phrase) {
        const lines = wrap(phrase, scene.bubbleMaxWidth);
        ctx.font = fontCss();
        const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
        const width = Math.ceil(widest + scene.bubblePad * 2);
        const height = Math.ceil(lines.length * scene.lineHeight + scene.bubblePad * 2);
        if (pathIsClear(walker, width, height)) {
          walker.lines = lines;
          walker.phrase = index;
          walker.bubbleWidth = width;
          walker.bubbleHeight = height;
        } else {
          deck.push(index); // tidak jadi dipakai: kembalikan ke atas tumpukan
        }
      }
    };

    const populate = (count: number) => {
      walkers.length = 0;
      for (let i = 0; i < count; i++) {
        const walker: Walker = {
          cell: cells[0],
          x: 0,
          ground: 0,
          direction: 1,
          speed: 0,
          steps: 0,
          cadence: 0,
          lines: [],
          phrase: -1,
          bubbleWidth: 0,
          bubbleHeight: 0,
          order: 0,
        };
        cast(walker, false);
        walkers.push(walker);
      }
      sortByDepth();
    };

    /** Yang garis tanahnya lebih bawah ada di depan, jadi digambar belakangan. */
    const sortByDepth = () => walkers.sort((a, b) => a.ground - b.ground);

    const advance = (dt: number) => {
      clock += dt;
      let recast = false;
      for (const walker of walkers) {
        walker.x += walker.direction * walker.speed * dt;
        walker.steps += walker.cadence * dt;
        const half = (walker.cell[2] * scene.cellScale) / 2;
        const gone = walker.direction === 1 ? walker.x - half > view.width : walker.x + half < 0;
        if (gone) {
          cast(walker, true);
          recast = true;
        }
      }
      if (recast) sortByDepth();
    };

    /** Badan terangkat sekali tiap langkah. */
    const liftOf = (walker: Walker) => Math.sin(Math.PI * (walker.steps % 1)) * scene.peepHeight * LIFT;
    /** Badan oleng ke kiri pada satu langkah, ke kanan pada langkah berikutnya. */
    const leanOf = (walker: Walker) => Math.sin(Math.PI * walker.steps) * LEAN;

    // ---------------------------------------------------------------- tata letak
    const measure = () => {
      view.width = canvas.clientWidth;
      view.height = canvas.clientHeight;
      if (view.width === 0 || view.height === 0 || !ready(sheets.light)) return false;
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(view.width * view.dpr);
      canvas.height = Math.round(view.height * view.dpr);

      // besar di layar besar, kecil di HP; tidak pernah melebihi jatah tinggi canvas
      const wanted = clamp(sizeBase + view.width * sizeByWidth, minPeepHeight, maxPeepHeight);
      let peepHeight = Math.min(wanted, view.height * maxHeightFraction);

      // Ruang di atas kepala baris paling belakang untuk balon paling tinggi beserta ekornya, supaya balon
      // orang di baris belakang tidak terpotong tepi atas canvas. Tanpa kalimat, tidak perlu ruang.
      const minDepth = 0.14; // baris belakang paling sedikit naik 14% tinggi badan
      const room = () => {
        const font = clamp(peepHeight * 0.05, 11, 20);
        const lineHeight = Math.round(font * 1.3);
        const pad = Math.round(font * 0.5);
        const maxWidth = Math.min(view.width - 32, font * 20);
        // balon paling tinggi di antara semua kalimat, diukur dengan pemecahan baris yang sama
        scene.font = font;
        const mostLines = phrases.reduce((most, phrase) => Math.max(most, wrap(phrase, maxWidth).length), 0);
        const bubble = mostLines * lineHeight + pad * 2;
        const gap = Math.round(font * 0.9);
        // balon + ekor dan celah + angkatan langkah + ruang napas di tepi atas
        const reserve = phrases.length === 0 ? 12 : bubble + gap + peepHeight * 0.03 + font * 1.2;
        const bottomPad = Math.max(10, peepHeight * 0.05);
        return { font, lineHeight, pad, maxWidth, gap, reserve, bottomPad, tallest: (view.height - bottomPad - reserve) / (1 + minDepth) };
      };
      let fit = room();
      if (fit.tallest < peepHeight) {
        peepHeight = Math.max(60, fit.tallest);
        fit = room();
      }

      scene.peepHeight = peepHeight;
      scene.cellScale = peepHeight / (sheets.light.naturalHeight / rowCount);
      scene.floor = view.height - fit.bottomPad;
      scene.depth = clamp(view.height - peepHeight - fit.bottomPad - fit.reserve, 0, peepHeight * 0.5);
      scene.font = fit.font;
      scene.lineHeight = fit.lineHeight;
      scene.bubblePad = fit.pad;
      scene.bubbleMaxWidth = fit.maxWidth;
      scene.bubbleGap = fit.gap;

      if (hostCell) {
        const scale = scene.cellScale * 1.12;
        hostBox.width = hostCell[2] * scale;
        hostBox.height = hostCell[3] * scale;
        hostBox.x = view.width * (view.width < 640 ? 0.5 : hostPosition);
        // berdiri sedikit di depan baris terdepan
        hostBox.ground = scene.floor + (view.height - scene.floor) * 0.45;
      }

      // Keramaian: kira-kira satu orang tiap 4% tinggi badan, di seluruh lebar layar.
      populate(clamp(Math.round((view.width / (peepHeight * 0.042)) * density), 10, 180));
      return true;
    };

    // ---------------------------------------------------------------- gambar
    /**
     * Balon ucapan sebagai satu bentuk utuh: kotak bersudut bulat yang ekornya menyatu di sisi bawah.
     * Garis tepi warna kertas memisahkannya dari kepala di belakangnya.
     */
    const bubbleShape = (
      left: number,
      top: number,
      width: number,
      height: number,
      tipX: number,
      tailHalf: number,
      radius = height / 2,
    ) => {
      const r = Math.min(radius, height / 2, width / 2);
      const right = left + width;
      const bottom = top + height;
      // pangkal ekor harus berada di bagian lurus sisi bawah
      const base = clamp(tipX, left + r + tailHalf, right - r - tailHalf);

      ctx.beginPath();
      ctx.moveTo(left + r, top);
      ctx.lineTo(right - r, top);
      ctx.arcTo(right, top, right, top + r, r);
      ctx.lineTo(right, bottom - r);
      ctx.arcTo(right, bottom, right - r, bottom, r);
      ctx.lineTo(base + tailHalf, bottom);
      ctx.quadraticCurveTo(base + tailHalf * 0.25, bottom, base, bottom + tailHalf * 1.35);
      ctx.quadraticCurveTo(base - tailHalf * 0.25, bottom, base - tailHalf, bottom);
      ctx.lineTo(left + r, bottom);
      ctx.arcTo(left, bottom, left, bottom - r, r);
      ctx.lineTo(left, top + r);
      ctx.arcTo(left, top, left + r, top, r);
      ctx.closePath();

      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(3, scene.font * 0.32);
      ctx.strokeStyle = colors.paper;
      ctx.stroke();
      ctx.fillStyle = colors.ink;
      ctx.fill();
    };

    const hostLift = () => (reduceMotion ? 0 : ((Math.sin((clock * Math.PI * 2) / 2.8) + 1) / 2) * hostBox.height * 0.012);

    /** Kotak balon tuan rumah. */
    const hostBubble = () => {
      if (!hostCell || !ready(mark)) return null;
      const markHeight = clamp(hostBox.height * 0.17, 30, 92);
      const markWidth = (markHeight * mark.naturalWidth) / mark.naturalHeight;
      const pad = markHeight * 0.32;
      const width = markWidth + pad * 2;
      const height = markHeight + pad * 2;
      const headTop = hostBox.ground - hostLift() - hostBox.height;
      return {
        left: clamp(hostBox.x + hostBox.width * 0.06, 6, view.width - width - 6),
        top: Math.max(4, headTop - height * 0.85),
        width,
        height,
        markWidth,
        markHeight,
        pad,
      };
    };

    const drawFigure = (cell: Cell, x: number, feetY: number, width: number, height: number, flip: 1 | -1, lean: number) => {
      ctx.save();
      // titik putar di telapak kaki: badan oleng, kaki tetap di tanah
      ctx.translate(x, feetY);
      if (lean) ctx.rotate(lean);
      if (flip === -1) ctx.scale(-1, 1);
      ctx.drawImage(sheet, cell[0], cell[1], cell[2], cell[3], -width / 2, -height, width, height);
      ctx.restore();
    };

    /**
     * Balon menempel tepat di atas kepala pembawanya, ekornya menunjuk ke kepala. Balon tidak ikut naik turun
     * langkah supaya tenang dilihat; celah ke kepala sudah menampung naik turunnya. Kalimat ditampilkan utuh,
     * dipecah per baris. Balon tidak pernah memudar atau disembunyikan di tengah layar: bebas tabrakannya
     * sudah dijamin saat balon dibagikan (lihat pathIsClear), jadi di sini tinggal digambar. Balon tuan rumah
     * tidak dihindari: tuan rumah digambar paling akhir, jadi balon lain lewat di belakangnya.
     */
    const drawBubbles = () => {
      if (phrases.length === 0) return;
      const speakers = walkers.filter((walker) => walker.lines.length > 0).sort((a, b) => a.order - b.order);
      ctx.font = fontCss();
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (const walker of speakers) {
        const width = walker.bubbleWidth;
        const height = walker.bubbleHeight;
        const half = width / 2;
        if (walker.x + half < 0 || walker.x - half > view.width) continue;
        const top = bubbleTop(walker, height);

        bubbleShape(walker.x - half, top, width, height, walker.x, scene.font * 0.5, scene.font);
        ctx.font = fontCss();
        ctx.fillStyle = colors.paper;
        walker.lines.forEach((line, i) => {
          ctx.fillText(line, walker.x, top + scene.bubblePad + (i + 0.5) * scene.lineHeight + scene.font * 0.06);
        });
      }
    };

    const paint = () => {
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.clearRect(0, 0, view.width, view.height);

      for (const walker of walkers) {
        drawFigure(
          walker.cell,
          walker.x,
          walker.ground - (reduceMotion ? 0 : liftOf(walker)),
          walker.cell[2] * scene.cellScale,
          walker.cell[3] * scene.cellScale,
          walker.direction,
          reduceMotion ? 0 : leanOf(walker),
        );
      }

      // balon digambar setelah semua orang supaya tidak tertutup orang di depannya
      drawBubbles();
      const box = hostBubble();

      // tuan rumah paling akhir: selalu di depan, tidak pernah tertutup
      if (hostCell) {
        drawFigure(hostCell, hostBox.x, hostBox.ground - hostLift(), hostBox.width, hostBox.height, 1, 0);
        if (box && ready(mark)) {
          bubbleShape(box.left, box.top, box.width, box.height, box.left + box.width * 0.28, box.markHeight * 0.2, box.height * 0.3);
          ctx.drawImage(mark, box.left + box.pad, box.top + box.pad, box.markWidth, box.markHeight);
        }
      }
    };

    // ---------------------------------------------------------------- putar dan jeda
    const frame = (now: number) => {
      // dibatasi supaya orang tidak melompat jauh setelah tab lama ditinggal
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      advance(dt);
      paint();
      frameId = requestAnimationFrame(frame);
    };

    const play = () => {
      if (playing || reduceMotion || disposed || view.width === 0) return;
      playing = true;
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    };

    const pause = () => {
      playing = false;
      cancelAnimationFrame(frameId);
    };

    let onScreen = false;
    const sync = () => (onScreen && !document.hidden ? play() : pause());

    // ---------------------------------------------------------------- tema, ukuran, muat
    /** Pakai gambar sesuai tema. Versi gelap baru dimuat saat pertama kali dibutuhkan. */
    const applyTheme = () => {
      const dark = isDark();
      colors.ink = dark ? "#ededed" : "#111111";
      colors.paper = dark ? "#121212" : "#ffffff";
      if (dark && srcDark && !sheets.dark) {
        sheets.dark = new Image();
        sheets.dark.onload = applyTheme;
        sheets.dark.src = srcDark;
      }
      if (dark && hostBubbleImageDark && !marks.dark) {
        marks.dark = new Image();
        marks.dark.onload = applyTheme;
        marks.dark.src = hostBubbleImageDark;
      }
      // sebelum versi gelap selesai dimuat, tetap pakai versi terang supaya tidak kosong
      sheet = dark && ready(sheets.dark) ? sheets.dark : sheets.light;
      mark = dark && ready(marks.dark) ? marks.dark : marks.light;
      if (!disposed && !playing && view.width > 0) paint();
    };

    const relayout = () => {
      if (disposed || !measure()) return;
      paint();
      sync();
    };

    let resizeTimer = 0;
    let seenWidth = 0;
    let seenHeight = 0;
    const resizeWatcher = new ResizeObserver(() => {
      if (canvas.clientWidth === seenWidth && canvas.clientHeight === seenHeight) return;
      seenWidth = canvas.clientWidth;
      seenHeight = canvas.clientHeight;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(relayout, 150);
    });
    const visibilityWatcher = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: "80px" },
    );
    const themeWatcher = new MutationObserver(applyTheme);

    sheets.light.onload = () => {
      if (disposed) return;
      sliceSheet();
      seenWidth = canvas.clientWidth;
      seenHeight = canvas.clientHeight;
      applyTheme();
      relayout();
      themeWatcher.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      resizeWatcher.observe(canvas);
      visibilityWatcher.observe(canvas);
      document.addEventListener("visibilitychange", sync);
    };
    sheets.light.src = src;
    if (marks.light && hostBubbleImage) {
      marks.light.onload = () => {
        if (!disposed && !playing && view.width > 0) paint();
      };
      marks.light.src = hostBubbleImage;
    }

    return () => {
      disposed = true;
      pause();
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", sync);
      themeWatcher.disconnect();
      resizeWatcher.disconnect();
      visibilityWatcher.disconnect();
    };
  }, [
    src,
    srcDark,
    perRow,
    rowCount,
    phrases,
    bubbleChance,
    density,
    sizeBase,
    sizeByWidth,
    minPeepHeight,
    maxPeepHeight,
    maxHeightFraction,
    hostIndex,
    hostBubbleImage,
    hostBubbleImageDark,
    hostPosition,
  ]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("block h-full w-full font-ui", className)} />;
}

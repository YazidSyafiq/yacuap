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
 * - balon ucapan berbaris di jalur tetap di atas kerumunan,
 * - satu "tuan rumah" yang diam di depan kerumunan dengan balon logo,
 * - berhenti saat tidak terlihat, dan menghormati prefers-reduced-motion,
 * - ikut mode gelap: sprite sendiri (garis tepi terang) dan balon terang, bukan warna yang dibalik.
 */

/** Potongan sprite: x, y, lebar, tinggi di gambar sumber. */
type Cell = readonly [sx: number, sy: number, sw: number, sh: number];

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
  /** Isi balon, atau null kalau tidak sedang ngomong. */
  text: string | null;
  textWidth: number;
  /** Transparansi balon saat ini, 0 sampai 1. Berubah halus. */
  alpha: number;
  /** Urutan masuk: yang lebih dulu masuk menang kalau dua balon berebut tempat. */
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
  /** Kalimat yang muncul di balon ucapan. Kosongkan untuk tanpa balon. */
  phrases?: readonly string[];
  /** Kalimat lebih panjang dari ini dipotong dengan elipsis supaya balon tidak memenuhi layar. */
  maxPhraseLength?: number;
  /** Peluang seseorang membawa balon, 0 sampai 1. */
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
  maxPhraseLength = 38,
  bubbleChance = 0.08,
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
      bubbleHeight: 24,
      lanes: [] as number[],
    };
    const cells: Cell[] = [];
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

    // ---------------------------------------------------------------- sprite
    const sliceSheet = () => {
      const width = sheets.light.naturalWidth / perRow;
      const height = sheets.light.naturalHeight / rowCount;
      for (let i = 0; i < perRow * rowCount; i++) {
        const cell: Cell = [(i % perRow) * width, Math.floor(i / perRow) * height, width, height];
        // tuan rumah tidak ikut berjalan, supaya tidak ada kembarannya di kerumunan
        if (i === hostIndex) hostCell = cell;
        else cells.push(cell);
      }
    };

    // ---------------------------------------------------------------- orang
    /** Isi ulang seorang pejalan dengan sosok, arah, kecepatan, dan balon yang baru. */
    const cast = (walker: Walker, atEdge: boolean) => {
      const pace = between(0.75, 1.3);
      const half = (walker.cell[2] * scene.cellScale) / 2;
      walker.cell = cells[pickIndex(cells.length)];
      walker.direction = Math.random() < 0.5 ? 1 : -1;
      walker.speed = scene.peepHeight * WALK_SPEED * pace;
      walker.cadence = (WALK_SPEED * pace) / STRIDE;
      walker.steps = Math.random() * 2;
      // tersebar dari baris depan sampai belakang, sedikit lebih ramai di depan
      walker.ground = scene.floor - scene.depth * Math.pow(Math.random(), 1.25);
      walker.x = atEdge
        ? walker.direction === 1
          ? -half - between(0, half * 3)
          : view.width + half + between(0, half * 3)
        : between(-half, view.width + half);
      walker.order = arrivals++;
      walker.alpha = 0;

      const phrase = phrases.length > 0 && Math.random() < bubbleChance ? phrases[pickIndex(phrases.length)] : null;
      walker.text =
        phrase && phrase.length > maxPhraseLength ? `${phrase.slice(0, maxPhraseLength - 1).trimEnd()}…` : phrase;
      if (walker.text) {
        ctx.font = fontCss();
        walker.textWidth = Math.ceil(ctx.measureText(walker.text).width + scene.font * 2);
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
          text: null,
          textWidth: 0,
          alpha: 0,
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

      // Ruang untuk jalur balon di atas kerumunan. Dua jalur kalau muat tanpa banyak mengecilkan orang,
      // kalau tidak, satu jalur saja. Tanpa kalimat, tidak perlu ruang.
      const minDepth = 0.14; // baris belakang paling sedikit naik 14% tinggi badan
      const room = (laneCount: number) => {
        const font = clamp(peepHeight * 0.05, 11, 20);
        const bubble = Math.round(font * 2);
        // jarak kepala ke jalur terbawah + jalur-jalurnya + angkatan langkah + ruang napas di tepi atas
        const reserve =
          laneCount === 0
            ? 12
            : laneCount * bubble + (laneCount - 1) * font * 0.5 + font * 1.1 + peepHeight * 0.03 + font * 1.6;
        const bottomPad = Math.max(10, peepHeight * 0.05);
        return { font, bubble, reserve, bottomPad, tallest: (view.height - bottomPad - reserve) / (1 + minDepth) };
      };
      let laneCount = phrases.length > 0 ? 2 : 0;
      let fit = room(laneCount);
      if (laneCount === 2 && fit.tallest < peepHeight * 0.94) {
        laneCount = 1;
        fit = room(laneCount);
      }
      if (fit.tallest < peepHeight) {
        peepHeight = Math.max(60, fit.tallest);
        fit = room(laneCount);
      }

      scene.peepHeight = peepHeight;
      scene.cellScale = peepHeight / (sheets.light.naturalHeight / rowCount);
      scene.floor = view.height - fit.bottomPad;
      scene.depth = clamp(view.height - peepHeight - fit.bottomPad - fit.reserve, 0, peepHeight * 0.5);
      scene.font = fit.font;
      scene.bubbleHeight = fit.bubble;
      // jalur 0 tepat di atas kepala baris paling belakang, jalur 1 di atasnya
      const crowdTop = scene.floor - scene.depth - peepHeight * 1.03;
      scene.lanes = Array.from(
        { length: laneCount },
        (_, lane) => crowdTop - fit.font * 1.1 - fit.bubble - lane * (fit.bubble + fit.font * 0.5),
      );

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

    /** Kotak balon tuan rumah; dipakai juga sebagai area yang harus dihindari balon lain. */
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
     * Balon berbaris di jalur tetap di atas kerumunan. Yang berjalan ke kanan di jalur bawah,
     * yang ke kiri di jalur atas, jadi balon yang berpapasan tidak bertabrakan. Kalau dua balon di jalur
     * yang sama berebut tempat, yang masuk belakangan memudar dulu.
     */
    const drawBubbles = (dt: number, avoid: ReturnType<typeof hostBubble>) => {
      if (scene.lanes.length === 0) return;
      const gap = scene.font * 0.9;
      const height = scene.bubbleHeight;
      const taken: Array<{ lane: number; x: number; width: number }> = [];
      const speakers = walkers.filter((walker) => walker.text).sort((a, b) => a.order - b.order);
      // mendekati sasaran secara eksponensial, tidak tergantung jumlah frame per detik
      const ease = dt > 0 ? 1 - Math.exp(-dt * 8) : 1;

      for (const walker of speakers) {
        const lane = scene.lanes.length > 1 && walker.direction === -1 ? 1 : 0;
        const top = scene.lanes[lane];
        const half = walker.textWidth / 2;

        let shown = walker.x - half >= 8 && walker.x + half <= view.width - 8;
        if (shown) {
          shown = !taken.some(
            (other) => other.lane === lane && Math.abs(other.x - walker.x) < (other.width + walker.textWidth) / 2 + gap,
          );
        }
        if (shown && avoid) {
          const overlapsX = walker.x + half + gap > avoid.left && walker.x - half - gap < avoid.left + avoid.width;
          const overlapsY = top + height + gap > avoid.top && top - gap < avoid.top + avoid.height;
          if (overlapsX && overlapsY) shown = false;
        }
        if (shown) taken.push({ lane, x: walker.x, width: walker.textWidth });

        walker.alpha += ((shown ? 1 : 0) - walker.alpha) * ease;
        if (walker.alpha < 0.03) continue;

        ctx.globalAlpha = walker.alpha;
        bubbleShape(walker.x - half, top, walker.textWidth, height, walker.x, scene.font * 0.5);
        ctx.font = fontCss();
        ctx.fillStyle = colors.paper;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(walker.text ?? "", walker.x, top + height / 2 + scene.font * 0.06);
        ctx.globalAlpha = 1;
      }
    };

    const paint = (dt: number) => {
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
      const box = hostBubble();
      drawBubbles(dt, box);

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
      paint(dt);
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
      if (!disposed && !playing && view.width > 0) paint(0);
    };

    const relayout = () => {
      if (disposed || !measure()) return;
      paint(0);
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
        if (!disposed && !playing && view.width > 0) paint(0);
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
    maxPhraseLength,
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

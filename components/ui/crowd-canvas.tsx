"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Kerumunan orang seluruh badan yang berjalan melintas, digambar di canvas.
 *
 * Diadaptasi dari Skiper UI "Skiper 39" (@gurvinder-singh02, https://gxuri.me), yang sendirinya
 * diadaptasi dari pen Szenia Zadvornykh (https://codepen.io/zadvorsky/pen/xxwbBQV).
 * Ilustrasi: Open Peeps karya Pablo Stanley (https://www.openpeeps.com/), CC0.
 * Versi gratis Skiper UI mewajibkan atribusi; kreditnya ada di halaman /tentang.
 *
 * Bedanya dengan aslinya:
 * - sosoknya seluruh badan dan menapak di tanah (sprite dari scripts/buat-sprite-kerumunan.cjs);
 *   tiap sel sprite sudah rata bawah, jadi dasar sel = telapak kaki,
 * - langkah: badan naik turun dan sedikit oleng kiri kanan seirama, kecepatan mengikuti tinggi badan,
 * - ukuran orang, balon, dan logo mengikuti lebar layar: besar di monitor, kecil di HP,
 * - balon ucapan di atas sebagian orang,
 * - satu "tuan rumah" yang diam di depan kerumunan dengan balon logo,
 * - berhenti saat tidak terlihat, dan menghormati prefers-reduced-motion,
 * - ikut mode gelap: sprite sendiri (garis tepi terang) dan balon terang, bukan warna yang dibalik.
 */

type Rect = [x: number, y: number, width: number, height: number];

type Peep = {
  rect: Rect;
  width: number;
  height: number;
  /** Titik tengah badan, sumbu x. */
  x: number;
  /** Garis tanah tempat kakinya menapak. */
  ground: number;
  /** Angkatan badan saat melangkah (px, ke atas). */
  lift: number;
  /** Olengan badan saat melangkah (radian). */
  rock: number;
  scaleX: 1 | -1;
  bubble: string | null;
  /** Lebar balon dalam px, diukur sekali saat balon diberikan. */
  bubbleWidth: number;
  /** Transparansi balon saat ini, 0 sampai 1. Berubah halus, tidak pernah muncul atau hilang mendadak. */
  bubbleAlpha: number;
  /** Urutan kedatangan: yang lebih dulu datang menang kalau dua balon berebut tempat. */
  order: number;
  walk: gsap.core.Timeline | null;
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
  /** Pengali keramaian. 1 = seramai versi aslinya, 0.5 = separuhnya. */
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
  /** Orang tidak pernah lebih tinggi dari bagian ini dari tinggi canvas, supaya balon tetap muat di atas kepala. */
  maxHeightFraction?: number;
  /** Tuan rumah: satu sosok yang diam di depan. */
  host?: CrowdHost;
  className?: string;
};

const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const randomIndex = (length: number) => Math.floor(Math.random() * length);

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

    // Tema mengikuti atribut data-theme di <html>. Mode gelap memakai sprite sendiri (orang dengan garis tepi
    // terang) dan balon terang bertulisan gelap. Warna tidak dibalik mentah, supaya orangnya tetap wajar.
    const root = document.documentElement;
    const isDark = () => root.getAttribute("data-theme") === "dark";
    const palette = () =>
      isDark() ? { ink: "#ededed", paper: "#121212" } : { ink: "#111111", paper: "#ffffff" };
    let { ink, paper } = palette();
    const fontFamily = getComputedStyle(canvas).fontFamily || "sans-serif";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const lightImg = new Image();
    let darkImg: HTMLImageElement | null = null;
    // gambar yang sedang dipakai; berganti saat tema berganti
    let img = lightImg;
    const lightMark = hostBubbleImage ? new Image() : null;
    let darkMark: HTMLImageElement | null = null;
    let bubbleImg = lightMark;
    // peepHeight: tinggi sel di layar. depth: rentang garis tanah dari baris depan ke belakang.
    // bubble*: ukuran huruf, tinggi balon, jumlah jalur, dan posisi atas tiap jalur.
    const stage = {
      width: 0,
      height: 0,
      dpr: 1,
      peepHeight: 0,
      scale: 1,
      floor: 0,
      depth: 0,
      bubbleFont: 12,
      bubbleHeight: 24,
      bubbleLanes: [] as number[],
    };
    let arrivals = 0;
    // sel sprite untuk pejalan (tanpa tuan rumah); satu sel boleh dipakai beberapa orang sekaligus
    const cells: Rect[] = [];
    const walkers: Peep[] = [];
    const available: Peep[] = [];
    const crowd: Peep[] = [];
    let hostPeep: Peep | null = null;
    let hostIdle: gsap.core.Tween | null = null;
    let running = false;
    let disposed = false;

    const createPeep = (rect: Rect): Peep => ({
      rect,
      width: rect[2],
      height: rect[3],
      x: 0,
      ground: 0,
      lift: 0,
      rock: 0,
      scaleX: 1,
      bubble: null,
      bubbleWidth: 0,
      bubbleAlpha: 0,
      order: 0,
      walk: null,
    });

    const readSprite = () => {
      const rectWidth = img.naturalWidth / perRow;
      const rectHeight = img.naturalHeight / rowCount;
      for (let i = 0; i < perRow * rowCount; i++) {
        const rect: Rect = [(i % perRow) * rectWidth, Math.floor(i / perRow) * rectHeight, rectWidth, rectHeight];
        // tuan rumah tidak ikut berjalan, supaya tidak ada kembarannya di kerumunan
        if (i === hostIndex) hostPeep = createPeep(rect);
        else cells.push(rect);
      }
    };

    /** Siapkan cukup pejalan untuk keramaian yang diminta, sel sprite dipakai bergiliran secara acak. */
    const fillWalkers = (count: number) => {
      walkers.length = 0;
      const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5);
      // cadangan supaya yang masuk berikutnya tidak selalu orang yang baru saja keluar
      const total = count + Math.max(12, Math.round(count * 0.2));
      for (let i = 0; i < total; i++) walkers.push(createPeep(cells[order[i % order.length]]));
    };

    const bubbleFontCss = () => `600 ${stage.bubbleFont}px ${fontFamily}`;

    const resetPeep = (peep: Peep) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      peep.width = peep.rect[2] * stage.scale;
      peep.height = peep.rect[3] * stage.scale;
      // tersebar dari baris depan sampai belakang, sedikit lebih ramai di depan
      peep.ground = stage.floor - stage.depth * Math.pow(Math.random(), 1.25);
      peep.scaleX = direction;
      peep.x = direction === 1 ? -peep.width : stage.width + peep.width;
      peep.lift = 0;
      peep.rock = 0;
      const phrase =
        phrases.length > 0 && Math.random() < bubbleChance ? phrases[randomIndex(phrases.length)] : null;
      peep.bubble =
        phrase && phrase.length > maxPhraseLength ? `${phrase.slice(0, maxPhraseLength - 1).trimEnd()}…` : phrase;
      peep.bubbleAlpha = 0;
      peep.order = arrivals++;
      if (peep.bubble) {
        ctx.font = bubbleFontCss();
        peep.bubbleWidth = Math.ceil(ctx.measureText(peep.bubble).width + stage.bubbleFont * 2);
      }
      return direction === 1 ? stage.width + peep.width : -peep.width;
    };

    const walk = (peep: Peep, endX: number) => {
      // kecepatan jalan kira-kira 0,55 tinggi badan per detik
      const distance = Math.abs(endX - peep.x);
      const duration = distance / (stage.peepHeight * 0.55);
      const step = 0.46; // detik per langkah
      const steps = Math.max(2, Math.round(duration / step));
      const tl = gsap.timeline({ paused: !running });
      tl.timeScale(randomRange(0.75, 1.3));
      tl.to(peep, { duration, x: endX, ease: "none" }, 0);
      // tiap langkah: badan terangkat lalu turun
      tl.to(
        peep,
        { duration: step / 2, lift: stage.peepHeight * 0.022, ease: "sine.out", yoyo: true, repeat: steps * 2 - 1 },
        0,
      );
      // tiap langkah: badan oleng ke sisi kaki yang menapak
      const lean = 0.03;
      tl.fromTo(
        peep,
        { rock: -lean },
        { duration: step, rock: lean, ease: "sine.inOut", yoyo: true, repeat: steps - 1 },
        0,
      );
      return tl;
    };

    const addPeepToCrowd = () => {
      const peep = available.splice(randomIndex(available.length), 1)[0];
      peep.walk = walk(peep, resetPeep(peep)).eventCallback("onComplete", () => {
        crowd.splice(crowd.indexOf(peep), 1);
        available.push(peep);
        addPeepToCrowd();
      });
      crowd.push(peep);
      // yang garis tanahnya lebih bawah ada di depan
      crowd.sort((a, b) => a.ground - b.ground);
      return peep;
    };

    const placeHost = () => {
      hostIdle?.kill();
      hostIdle = null;
      if (!hostPeep) return;
      const peep: Peep = hostPeep;
      const scale = stage.scale * 1.12;
      peep.width = peep.rect[2] * scale;
      peep.height = peep.rect[3] * scale;
      peep.scaleX = 1;
      peep.rock = 0;
      peep.lift = 0;
      peep.x = stage.width * (stage.width < 640 ? 0.5 : hostPosition);
      // berdiri sedikit di depan baris terdepan
      peep.ground = stage.floor + (stage.height - stage.floor) * 0.45;
      if (!reduceMotion) {
        hostIdle = gsap.to(peep, {
          lift: peep.height * 0.012,
          duration: 1.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          paused: !running,
        });
      }
    };

    const headTop = (peep: Peep) => peep.ground - peep.lift - peep.height;

    /**
     * Balon ucapan sebagai SATU bentuk utuh: kotak bersudut bulat yang ekornya menyatu halus di sisi bawah.
     * Garis tepi warna kertas memisahkannya dari kepala di belakangnya.
     * tailX: titik ujung ekor. tail: setengah lebar pangkal ekor.
     */
    const roundedBubble = (
      left: number,
      top: number,
      width: number,
      height: number,
      tailX: number,
      tail: number,
      radius = height / 2,
    ) => {
      const r = Math.min(radius, height / 2, width / 2);
      const right = left + width;
      const bottom = top + height;
      // pangkal ekor harus berada di bagian lurus sisi bawah
      const baseX = Math.max(left + r + tail, Math.min(right - r - tail, tailX));
      const tipY = bottom + tail * 1.35;

      ctx.beginPath();
      ctx.moveTo(left + r, top);
      ctx.lineTo(right - r, top);
      ctx.arcTo(right, top, right, top + r, r);
      ctx.lineTo(right, bottom - r);
      ctx.arcTo(right, bottom, right - r, bottom, r);
      ctx.lineTo(baseX + tail, bottom);
      // ekor: dua lengkung yang keluar mendatar dari sisi bawah dan bertemu di ujung
      ctx.quadraticCurveTo(baseX + tail * 0.25, bottom, baseX, tipY);
      ctx.quadraticCurveTo(baseX - tail * 0.25, bottom, baseX - tail, bottom);
      ctx.lineTo(left + r, bottom);
      ctx.arcTo(left, bottom, left, bottom - r, r);
      ctx.lineTo(left, top + r);
      ctx.arcTo(left, top, left + r, top, r);
      ctx.closePath();

      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(3, stage.bubbleFont * 0.32);
      ctx.strokeStyle = paper;
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.fill();
    };

    /** Kotak balon tuan rumah, dipakai juga sebagai area yang harus dihindari balon lain. */
    const hostBubbleBox = () => {
      if (!hostPeep || !bubbleImg || !bubbleImg.complete || bubbleImg.naturalWidth === 0) return null;
      const peep: Peep = hostPeep;
      const markHeight = Math.max(30, Math.min(92, peep.height * 0.17));
      const markWidth = (markHeight * bubbleImg.naturalWidth) / bubbleImg.naturalHeight;
      const pad = markHeight * 0.32;
      const width = markWidth + pad * 2;
      const height = markHeight + pad * 2;
      // di kanan atas kepala, tempat suaranya keluar
      const left = Math.max(6, Math.min(stage.width - width - 6, peep.x + peep.width * 0.06));
      const top = Math.max(4, headTop(peep) - height * 0.85);
      return { left, top, width, height, markWidth, markHeight, pad };
    };

    /**
     * Balon celetukan berbaris rapi di jalur tetap di atas kerumunan, bukan menempel di tiap kepala.
     * Yang berjalan ke kanan di jalur bawah, yang ke kiri di jalur atas (kalau ada dua jalur),
     * jadi balon yang berpapasan tidak bertabrakan. Kalau dua balon di jalur yang sama berebut tempat,
     * yang datang belakangan memudar dulu.
     */
    const drawBubbles = () => {
      const lanes = stage.bubbleLanes;
      if (lanes.length === 0) return;
      const hostBox = hostBubbleBox();
      const gap = stage.bubbleFont * 0.9;
      const height = stage.bubbleHeight;
      const speakers = crowd.filter((peep) => peep.bubble).sort((a, b) => a.order - b.order);
      const placed: Array<{ lane: number; x: number; width: number }> = [];

      for (const peep of speakers) {
        const lane = lanes.length > 1 && peep.scaleX === -1 ? 1 : 0;
        const top = lanes[lane];
        const half = peep.bubbleWidth / 2;
        let visible = peep.x - half >= 8 && peep.x + half <= stage.width - 8;
        if (visible) {
          visible = !placed.some(
            (other) => other.lane === lane && Math.abs(other.x - peep.x) < (other.width + peep.bubbleWidth) / 2 + gap,
          );
        }
        if (visible && hostBox) {
          const overlapsX = peep.x + half + gap > hostBox.left && peep.x - half - gap < hostBox.left + hostBox.width;
          const overlapsY = top + height + gap > hostBox.top && top - gap < hostBox.top + hostBox.height;
          if (overlapsX && overlapsY) visible = false;
        }
        if (visible) placed.push({ lane, x: peep.x, width: peep.bubbleWidth });

        // memudar halus menuju terlihat atau tersembunyi
        const target = visible ? 1 : 0;
        peep.bubbleAlpha = reduceMotion || !running ? target : peep.bubbleAlpha + (target - peep.bubbleAlpha) * 0.12;
        if (peep.bubbleAlpha < 0.03) continue;

        ctx.globalAlpha = peep.bubbleAlpha;
        roundedBubble(peep.x - half, top, peep.bubbleWidth, height, peep.x, stage.bubbleFont * 0.5);
        ctx.font = bubbleFontCss();
        ctx.fillStyle = paper;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(peep.bubble ?? "", peep.x, top + height / 2 + stage.bubbleFont * 0.06);
        ctx.globalAlpha = 1;
      }
    };

    const drawHostBubble = () => {
      const box = hostBubbleBox();
      if (!box || !bubbleImg) return;
      roundedBubble(
        box.left,
        box.top,
        box.width,
        box.height,
        box.left + box.width * 0.28,
        box.markHeight * 0.2,
        box.height * 0.3,
      );
      ctx.drawImage(bubbleImg, box.left + box.pad, box.top + box.pad, box.markWidth, box.markHeight);
    };

    const drawPeep = (peep: Peep) => {
      ctx.save();
      // titik putar di telapak kaki: badan oleng, kaki tetap di tanah
      ctx.translate(peep.x, peep.ground - peep.lift);
      ctx.rotate(peep.rock);
      ctx.scale(peep.scaleX, 1);
      ctx.drawImage(img, ...peep.rect, -peep.width / 2, -peep.height, peep.width, peep.height);
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(stage.dpr, stage.dpr);
      for (const peep of crowd) drawPeep(peep);
      // balon digambar setelah semua orang supaya tidak tertutup orang di depannya
      drawBubbles();
      // tuan rumah paling akhir: selalu di depan, tidak pernah tertutup
      if (hostPeep) {
        drawPeep(hostPeep);
        drawHostBubble();
      }
      ctx.restore();
    };

    const setRunning = (next: boolean) => {
      if (reduceMotion || next === running) return;
      running = next;
      for (const peep of crowd) peep.walk?.paused(!next);
      hostIdle?.paused(!next);
      if (next) gsap.ticker.add(render);
      else gsap.ticker.remove(render);
    };

    const layout = () => {
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      if (stage.width === 0 || stage.height === 0) return;
      stage.dpr = Math.min(window.devicePixelRatio || 1, 2);
      // besar di layar besar, kecil di HP; tidak pernah melebihi jatah tinggi canvas
      const byWidth = Math.max(minPeepHeight, Math.min(maxPeepHeight, sizeBase + stage.width * sizeByWidth));
      let peepHeight = Math.min(byWidth, stage.height * maxHeightFraction);

      // Ruang untuk jalur balon di atas kerumunan. Dua jalur kalau muat tanpa banyak mengecilkan orang,
      // kalau tidak, satu jalur saja. Tanpa celetukan, tidak perlu ruang.
      const minDepth = 0.14; // baris belakang paling sedikit naik 14% tinggi badan
      const fit = (lanes: number) => {
        const font = Math.max(11, Math.min(20, peepHeight * 0.05));
        const bubble = Math.round(font * 2);
        // jarak kepala ke jalur terbawah (1,1 huruf) + jalur-jalurnya + angkatan langkah (3% badan)
        // + ruang napas di tepi atas, supaya balon tidak menempel ke apa pun yang ada di atas canvas
        const reserve =
          lanes === 0 ? 12 : lanes * bubble + (lanes - 1) * font * 0.5 + font * 1.1 + peepHeight * 0.03 + font * 1.6;
        const bottomPad = Math.max(10, peepHeight * 0.05);
        const maxPeep = (stage.height - bottomPad - reserve) / (1 + minDepth);
        return { font, bubble, reserve, bottomPad, maxPeep };
      };
      let lanes = phrases.length > 0 ? 2 : 0;
      let room = fit(lanes);
      if (lanes === 2 && room.maxPeep < peepHeight * 0.94) {
        lanes = 1;
        room = fit(lanes);
      }
      if (room.maxPeep < peepHeight) {
        peepHeight = Math.max(60, room.maxPeep);
        room = fit(lanes);
      }

      stage.peepHeight = peepHeight;
      stage.scale = peepHeight / (img.naturalHeight / rowCount);
      stage.floor = stage.height - room.bottomPad;
      stage.depth = Math.max(0, Math.min(peepHeight * 0.5, stage.height - peepHeight - room.bottomPad - room.reserve));
      stage.bubbleFont = room.font;
      stage.bubbleHeight = room.bubble;
      // jalur 0 tepat di atas kepala baris paling belakang, jalur 1 di atasnya
      const crowdTop = stage.floor - stage.depth - peepHeight * 1.03;
      stage.bubbleLanes = Array.from(
        { length: lanes },
        (_, lane) => crowdTop - room.font * 1.1 - room.bubble - lane * (room.bubble + room.font * 0.5),
      );
      canvas.width = Math.round(stage.width * stage.dpr);
      canvas.height = Math.round(stage.height * stage.dpr);

      for (const peep of crowd) peep.walk?.kill();
      crowd.length = 0;
      available.length = 0;
      // Keramaian: badan penuh jauh lebih ramping dari setengah badan, jadi jumlahnya harus lebih banyak
      // supaya sama ramainya. Kira-kira satu orang tiap 4% tinggi badan, di seluruh lebar layar.
      const count = Math.min(180, Math.max(10, Math.round((stage.width / (stage.peepHeight * 0.042)) * density)));
      fillWalkers(count);
      available.push(...walkers);
      for (let i = 0; i < count; i++) addPeepToCrowd().walk?.progress(Math.random());
      placeHost();
      render();
    };

    let resizeTimer = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = canvas;
      if (clientWidth === lastWidth && clientHeight === lastHeight) return;
      lastWidth = clientWidth;
      lastHeight = clientHeight;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    });

    const intersectionObserver = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), {
      rootMargin: "80px",
    });
    const onVisibility = () => setRunning(!document.hidden);

    /** Pakai gambar sesuai tema. Versi gelap baru dimuat saat pertama kali dibutuhkan. */
    const applyTheme = () => {
      ({ ink, paper } = palette());
      const dark = isDark();
      if (dark && srcDark && !darkImg) {
        darkImg = new Image();
        darkImg.onload = applyTheme;
        darkImg.src = srcDark;
      }
      if (dark && hostBubbleImageDark && !darkMark) {
        darkMark = new Image();
        darkMark.onload = applyTheme;
        darkMark.src = hostBubbleImageDark;
      }
      // sebelum versi gelap selesai dimuat, tetap pakai versi terang supaya tidak kosong
      img = dark && darkImg && darkImg.complete && darkImg.naturalWidth > 0 ? darkImg : lightImg;
      bubbleImg = dark && darkMark && darkMark.complete && darkMark.naturalWidth > 0 ? darkMark : lightMark;
      if (!disposed && !running && lightImg.complete && stage.width > 0) render();
    };
    const themeObserver = new MutationObserver(applyTheme);

    lightImg.onload = () => {
      if (disposed) return;
      readSprite();
      lastWidth = canvas.clientWidth;
      lastHeight = canvas.clientHeight;
      layout();
      applyTheme();
      themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      resizeObserver.observe(canvas);
      intersectionObserver.observe(canvas);
      document.addEventListener("visibilitychange", onVisibility);
    };
    lightImg.src = src;
    if (lightMark && hostBubbleImage) {
      lightMark.onload = () => {
        if (!disposed && !running && stage.width > 0) render();
      };
      lightMark.src = hostBubbleImage;
    }

    return () => {
      disposed = true;
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      gsap.ticker.remove(render);
      hostIdle?.kill();
      for (const peep of crowd) peep.walk?.kill();
    };
  }, [
    src,
    srcDark,
    perRow,
    rowCount,
    phrases,
    maxPhraseLength,
    bubbleChance,
    sizeBase,
    sizeByWidth,
    density,
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

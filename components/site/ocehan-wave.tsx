"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Satu jalur paling sedikit berisi segini pil, supaya layar lebar tetap penuh walau ocehannya sedikit. */
const MIN_PER_LANE = 14;
/** Lima jalur rapat: di laptop sekitar 30 ocehan terlihat sekaligus. */
const LANES = 5;
/** Pop up otomatis: tampil selama SHOW_MS, lalu jeda GAP_MS sebelum ocehan acak berikutnya. */
const SHOW_MS = 3400;
const GAP_MS = 2600;
/** Ocehan yang dipilih sendiri dengan klik ditahan lebih lama. */
const MANUAL_MS = 6000;
/** Laju hanyut ke kiri saat tidak disentuh, piksel per detik. */
const DRIFT = -36;
/** Tiap jalur bergerak dengan laju sedikit berbeda, supaya tidak terasa seperti satu lembar yang digeser. */
const LANE_PACE = [1, 0.74, 1.18, 0.86, 1.1];

/**
 * Ocehan tampil sebagai teks saja, tanpa kotak. Supaya tidak jadi tembok tulisan yang rata,
 * tiga gaya huruf bergantian: tebal bertinta, miring abu, dan miring bertinta.
 */
const TEXT_STYLES = [
  "font-semibold text-ink",
  "italic text-muted hover:text-ink",
  "italic text-ink",
] as const;

type Layout = { spacing: number; amp: number; pill: number; laneGap: number; top: number; height: number };

const layoutFor = (width: number): Layout => {
  const compact = width < 640;
  // `pill` = tinggi blok teks: dua baris di layar lebar, tiga baris di HP
  const spacing = compact ? 175 : 225;
  const amp = compact ? 14 : 20;
  const pill = compact ? 58 : 46;
  // jarak antarjalur cukup untuk satu pil plus naik-turun zigzag kedua jalur, supaya tidak pernah bertabrakan
  const laneGap = pill + amp * 2 + 8;
  const top = amp + pill / 2 + 10;
  return { spacing, amp, pill, laneGap, top, height: top + laneGap * (LANES - 1) + amp + pill / 2 + 10 };
};

/** Gelombang segitiga, hasilnya -1 sampai 1. Inilah zigzagnya. */
const zigzag = (u: number) => 2 * Math.abs(2 * (u - Math.floor(u + 0.5))) - 1;
const wrap = (value: number, length: number) => ((value % length) + length) % length;

/**
 * Semua ocehan sebagai teks tanpa kotak yang mengalir rapat di lima jalur zigzag sejajar.
 *
 * - Jalurnya diam di layar dan tidak digambar; pil-pilnya yang bergerak menyusurinya, jadi tiap pil naik turun
 *   bergantian dan barisnya terlihat berkelok.
 * - Hanyut pelan ke kiri sendiri, tiap jalur dengan laju sedikit berbeda. Bisa digeser dengan kursor atau jari,
 *   dan meluncur sebentar setelah dilepas.
 * - Pil di tengah sedikit lebih besar; yang mendekati tepi mengecil dan memudar.
 * - Pop up otomatis: tiap beberapa detik satu ocehan acak tampil membesar di tengah area zigzag,
 *   zigzag di belakangnya kabur, lalu hilang sendiri dan berganti ocehan lain. Gayanya kutipan "visi":
 *   tanda kutip raksasa pudar, label OCEHAN, isi ocehan besar dan tebal, lalu garis aksen pendek.
 *   Pop up hanya menutupi area zigzag, bukan seluruh layar, jadi halaman tetap bisa digulir.
 * - Diklik atau diketuk, ocehan itu yang langsung tampil dan ditahan lebih lama. Sentuhan berikutnya menutupnya.
 *
 * Sebelum JavaScript jalan, atau kalau pengunjung meminta animasi dikurangi, ini daftar teks biasa
 * yang turun baris, tanpa pop up otomatis. Pop up lewat klik tetap jalan.
 */
export function OcehanWave({ phrases }: { phrases: readonly string[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  // ocehan yang sedang (atau terakhir) tampil di pop up, dan apakah pop up-nya sedang terlihat
  const [spot, setSpot] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  /** Dipanggil saat pengunjung memilih sendiri sebuah ocehan; diisi oleh efek pop up di bawah. */
  const pickRef = useRef<(text: string) => void>(() => {});
  const dismissRef = useRef<() => void>(() => {});

  // pil per jalur: semua ocehan dibagi bergiliran; kalau masih sedikit, diulang sampai jalurnya penuh
  const lanes = Array.from({ length: LANES }, (_, lane) => {
    const own = phrases.filter((_, index) => index % LANES === lane);
    const base = own.length > 0 ? own : phrases;
    return Array.from({ length: Math.max(base.length, MIN_PER_LANE) }, (_, slot) => ({
      text: base[slot % base.length],
      repeat: slot >= base.length || own.length === 0,
    }));
  });
  const laneSizes = lanes.map((items) => items.length).join(",");

  // ------------------------------------------------------------------ gerak
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || phrases.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = Array.from(stage.querySelectorAll<HTMLElement>("[data-wave-item]"));
    let layout = layoutFor(stage.clientWidth);
    let width = stage.clientWidth;
    let offset = 0;
    let velocity = DRIFT;
    let dragging = false;
    let lastX = 0;
    let lastTime = 0;
    let travelled = 0;
    let frameId = 0;
    let onScreen = true;

    const measure = () => {
      width = stage.clientWidth;
      layout = layoutFor(width);
      stage.style.height = `${layout.height}px`;
      stage.style.setProperty("--pill-max", `${layout.spacing - 18}px`);
    };

    const counts = laneSizes.split(",").map(Number);
    const place = () => {
      const period = layout.spacing * 2;
      for (const item of items) {
        const lane = Number(item.dataset.lane);
        const slot = Number(item.dataset.slot);
        const track = counts[lane] * layout.spacing;
        const x =
          wrap(slot * layout.spacing + (lane * layout.spacing) / 2 + offset * LANE_PACE[lane], track) - layout.spacing;
        if (x < -layout.spacing || x > width + layout.spacing) {
          item.style.visibility = "hidden";
          continue;
        }
        const y = layout.top + lane * layout.laneGap + layout.amp * zigzag((x - (lane * period) / 2) / period);
        const fromCenter = Math.min(1, Math.abs(x - width / 2) / (width / 2));
        const scale = 1 - 0.1 * fromCenter;
        const edge = Math.min(x, width - x);
        item.style.visibility = "visible";
        item.style.opacity = String(Math.max(0, Math.min(1, edge / 80)));
        item.style.zIndex = String(Math.round(scale * 100));
        item.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (!dragging) {
        // setelah dilepas, kecepatan pelan-pelan kembali ke laju hanyut
        velocity += (DRIFT - velocity) * (1 - Math.exp(-dt * 2.2));
        offset += velocity * dt;
      }
      place();
      frameId = requestAnimationFrame(frame);
    };
    const play = () => {
      cancelAnimationFrame(frameId);
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    };
    const sync = () => (onScreen && !document.hidden ? play() : cancelAnimationFrame(frameId));

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // sentuhan apa pun menutup pop up yang sedang tampil
      dismissRef.current();
      dragging = true;
      travelled = 0;
      lastX = event.clientX;
      velocity = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      lastX = event.clientX;
      travelled += Math.abs(dx);
      offset += dx;
      // perkiraan kecepatan untuk luncuran setelah dilepas
      velocity = velocity * 0.6 + (dx / 0.016) * 0.4;
      if (travelled > 6) {
        suppressClick.current = true;
        stage.setPointerCapture(event.pointerId);
      }
    };
    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      velocity = Math.max(-1600, Math.min(1600, velocity));
      // klik yang menyusul geseran diabaikan, lalu penandanya dilepas
      window.setTimeout(() => (suppressClick.current = false), 0);
    };

    stage.dataset.live = "true";
    measure();
    place();

    let resizeTimer = 0;
    const resizeWatcher = new ResizeObserver(() => {
      if (stage.clientWidth === width) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        place();
      }, 120);
    });
    const visibilityWatcher = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { rootMargin: "100px" },
    );
    resizeWatcher.observe(stage);
    visibilityWatcher.observe(stage);
    document.addEventListener("visibilitychange", sync);
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(resizeTimer);
      resizeWatcher.disconnect();
      visibilityWatcher.disconnect();
      document.removeEventListener("visibilitychange", sync);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
      delete stage.dataset.live;
      stage.style.height = "";
      for (const item of items) item.removeAttribute("style");
    };
  }, [phrases.length, laneSizes]);

  // ------------------------------------------------------------------ pop up otomatis
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || phrases.length === 0) return;
    const auto = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let timer = 0;
    let onScreen = false;
    let last = -1;

    const hide = () => {
      setShown(false);
      window.clearTimeout(timer);
      if (auto) timer = window.setTimeout(next, GAP_MS);
    };
    const show = (text: string, duration: number) => {
      window.clearTimeout(timer);
      setSpot(text);
      setShown(true);
      timer = window.setTimeout(hide, duration);
    };
    /** Pilih ocehan acak, asal bukan yang baru saja tampil. Hanya jalan kalau bagiannya sedang terlihat. */
    function next() {
      if (!onScreen || document.hidden) {
        timer = window.setTimeout(next, 1000);
        return;
      }
      let index = Math.floor(Math.random() * phrases.length);
      if (index === last && phrases.length > 1) index = (index + 1) % phrases.length;
      last = index;
      show(phrases[index], SHOW_MS);
    }

    pickRef.current = (text) => show(text, auto ? MANUAL_MS : 60_000);
    dismissRef.current = () => {
      window.clearTimeout(timer);
      setShown(false);
      if (auto) timer = window.setTimeout(next, GAP_MS);
    };

    const watcher = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.45 });
    watcher.observe(stage);
    if (auto) timer = window.setTimeout(next, 1400);

    return () => {
      window.clearTimeout(timer);
      watcher.disconnect();
      pickRef.current = () => {};
      dismissRef.current = () => {};
    };
  }, [phrases]);

  if (phrases.length === 0) return null;

  return (
    <div className="relative">
      <div ref={stageRef} className="ocehan-wave">
        <ul className="ocehan-wave-list">
          {lanes.map((items, lane) =>
            items.map((item, slot) => (
              <li
                key={`${lane}-${slot}`}
                data-wave-item=""
                data-lane={lane}
                data-slot={slot}
                aria-hidden={item.repeat ? "true" : undefined}
                className={cn(item.repeat && "ocehan-wave-repeat")}
              >
                <button
                  type="button"
                  tabIndex={item.repeat ? -1 : undefined}
                  onClick={() => {
                    if (suppressClick.current) return;
                    pickRef.current(item.text);
                  }}
                  className={cn(
                    "ocehan-pill block cursor-pointer rounded-md px-1 text-center font-display text-[15px] leading-[1.28] underline-offset-4 transition-colors hover:underline sm:text-[17px]",
                    TEXT_STYLES[(lane + slot) % TEXT_STYLES.length],
                  )}
                >
                  {/* paling banyak tiga baris di HP dan dua di layar lebar; sisanya elipsis, lengkapnya di pop up */}
                  <span className="line-clamp-3 text-balance sm:line-clamp-2">{item.text}</span>
                </button>
              </li>
            )),
          )}
        </ul>
      </div>

      {/*
        Pop up: menutupi area zigzag saja, mengaburkan zigzag di belakangnya. Tidak menangkap klik,
        jadi zigzag tetap bisa digeser dan ocehan lain tetap bisa dipilih. Isinya sudah ada di daftar,
        jadi untuk pembaca layar ini hiasan.
      */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/65 px-6 backdrop-blur-md transition-opacity duration-300 sm:px-10",
          shown ? "opacity-100" : "opacity-0",
        )}
      >
        {spot !== null ? (
          // gaya kutipan "visi": tanda kutip raksasa pudar, label, isi besar dan tebal, garis aksen
          <figure key={spot} className={cn("relative w-full max-w-3xl pl-8 sm:pl-16", shown && "ocehan-pop")}>
            <span className="pointer-events-none absolute -left-2 -top-12 select-none font-display text-[10rem] leading-none text-ink/12 sm:-left-1 sm:-top-20 sm:text-[16rem]">
              &ldquo;
            </span>
            <div className="relative flex flex-col gap-5">
              <p className="font-ui text-sm font-semibold uppercase tracking-[0.18em] text-ink">Ocehan</p>
              <blockquote className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight sm:text-[3.5rem]">
                {spot}
              </blockquote>
              <span className="h-1 w-16 rounded-full bg-ink" />
            </div>
          </figure>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { DownloadIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { Button, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const RATIOS = [
  { key: "4x5", label: "Instagram", platform: "instagram" },
  { key: "9x16", label: "TikTok & Story", platform: "tiktok" },
] as const;

/**
 * Pop up kartu bagikan: pilih ukuran, lihat pratinjaunya, lalu unduh gambarnya.
 * `src` adalah alamat gambar tanpa parameter rasio; `version` ikut di alamat supaya pratinjau berganti setelah datanya diubah.
 * Dengan `pages` lebih dari satu, tiap halaman punya pratinjau dan tombol unduh sendiri (`n` = nomor halaman mulai 0),
 * dan `zipSrc` memberi tombol unduh semua sekaligus.
 */
export function ShareModal({
  title,
  note = "Gambarnya dibuat otomatis, tinggal unduh terus unggah.",
  src,
  version = "",
  fileName,
  alt,
  pages = 1,
  zipSrc,
  styles,
  onClose,
}: {
  title: string;
  note?: string;
  src: string;
  version?: string;
  /** Nama file unduhan tanpa platform dan ekstensi, misalnya "chart-minggu-ini". */
  fileName: string;
  alt: string;
  pages?: number;
  zipSrc?: string;
  /** Pilihan gaya gambar (parameter `gaya`), kalau kartunya punya lebih dari satu gaya. */
  styles?: ReadonlyArray<{ key: string; label: string }>;
  onClose: () => void;
}) {
  const [ratioKey, setRatioKey] = useState<(typeof RATIOS)[number]["key"]>("4x5");
  const [styleKey, setStyleKey] = useState(styles?.[0]?.key ?? "");
  // penanda saat pop up dibuka, supaya browser tidak memakai gambar lama dari cache setelah tampilannya diubah
  const [opened] = useState(() => Date.now().toString(36));
  const ratio = RATIOS.find((item) => item.key === ratioKey) ?? RATIOS[0];
  const styleParam = styleKey ? `&gaya=${styleKey}` : "";
  const urlFor = (page: number) => `${src}?rasio=${ratio.key}${styleParam}${pages > 1 ? `&n=${page}` : ""}&v=${encodeURIComponent(`${version}-${opened}`)}`;
  const multi = pages > 1;

  return (
    <Modal open onClose={onClose} title={title} note={note} size={multi ? "lg" : "md"}>
      <div className="flex flex-col items-center gap-4">
        {styles && styles.length > 1 ? (
          <div role="group" aria-label="Gaya gambar" className="grid w-full gap-1 rounded-xl border border-line bg-surface p-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
            {styles.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={item.key === styleKey}
                onClick={() => setStyleKey(item.key)}
                className={cn(
                  "flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
                  item.key === styleKey ? "bg-ink text-surface" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        <div role="group" aria-label="Ukuran gambar" className="grid w-full grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
          {RATIOS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={item.key === ratio.key}
              onClick={() => setRatioKey(item.key)}
              className={cn(
                "flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
                item.key === ratio.key ? "bg-ink text-surface" : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* gambar hasil buatan server, ukurannya sudah final; tidak perlu dioptimalkan lagi */}
        <div className={cn("grid w-full gap-4", multi ? "grid-cols-1 justify-items-center sm:grid-cols-2" : "grid-cols-1 justify-items-center")}>
          {Array.from({ length: pages }, (_, page) => (
            <div key={page} className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={urlFor(page)}
                src={urlFor(page)}
                alt={multi ? `${alt}, halaman ${page + 1}` : alt}
                className={cn("rounded-xl border border-line bg-(--cover)", ratio.key === "9x16" ? "aspect-[9/16] w-[min(100%,220px)]" : "aspect-[4/5] w-[min(100%,300px)]")}
              />
              {multi ? (
                <a href={urlFor(page)} download={`${fileName}${styleKey ? `-${styleKey}` : ""}-${String(page + 1).padStart(2, "0")}-${ratio.platform}.png`} className={buttonClass("secondary", "sm")}>
                  <DownloadIcon className="size-4" />
                  Halaman {page + 1}
                </a>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid w-full gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
          <Button variant="secondary" size="sm" block onClick={onClose}>
            Tutup
          </Button>
          {multi && zipSrc ? (
            <a href={`${zipSrc}?rasio=${ratio.key}${styleParam}`} className={buttonClass("primary", "sm", undefined, true)}>
              <DownloadIcon className="size-4" />
              <span className="sm:hidden">Unduh Semua</span>
              <span className="hidden sm:inline">Unduh Semua (zip)</span>
            </a>
          ) : (
            <a href={urlFor(0)} download={`${fileName}${styleKey ? `-${styleKey}` : ""}-${ratio.platform}.png`} className={buttonClass("primary", "sm", undefined, true)}>
              <DownloadIcon className="size-4" />
              Unduh
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

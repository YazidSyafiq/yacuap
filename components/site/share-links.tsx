"use client";

import { useState, useSyncExternalStore } from "react";
import { SocialIcon } from "@/components/site/social-icon";

/** Tujuan bagikan yang punya alamat "bagikan tautan" sendiri. `{u}` alamat tulisan, `{t}` judulnya. */
const TARGETS = [
  { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/?text={t}%20{u}" },
  { key: "x", label: "X", href: "https://x.com/intent/post?text={t}&url={u}" },
  { key: "threads", label: "Threads", href: "https://www.threads.net/intent/post?text={t}%20{u}" },
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u={u}" },
  { key: "telegram", label: "Telegram", href: "https://t.me/share/url?url={u}&text={t}" },
] as const;

const buttonClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bg";

// menu bagikan bawaan HP (di situ ada Instagram, TikTok, dan aplikasi lain); di server dan di komputer biasanya tidak ada
const noop = () => () => {};
const canNativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Tombol bagikan tautan tulisan untuk pembaca: WhatsApp, X, Threads, Facebook, Telegram, salin tautan,
 * dan (di HP) menu bagikan bawaan untuk aplikasi lain seperti Instagram.
 * Alamatnya diambil dari alamat halaman yang sedang dibuka, jadi selalu benar di domain mana pun.
 */
export function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const native = useSyncExternalStore(noop, canNativeShare, () => false);

  const pageUrl = () => `${window.location.origin}${window.location.pathname}`;

  function open(template: string) {
    const href = template.replace("{u}", encodeURIComponent(pageUrl())).replace("{t}", encodeURIComponent(title));
    window.open(href, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard diblokir: tidak ada yang bisa dilakukan, tombol lain tetap jalan
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title, url: pageUrl() });
    } catch {
      // dibatalkan pembaca
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <p className="font-ui text-sm text-muted" aria-live="polite">
        {copied ? "Tautannya tersalin." : "Bagikan tulisan ini"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {TARGETS.map((target) => (
          <button key={target.key} type="button" onClick={() => open(target.href)} aria-label={`Bagikan ke ${target.label}`} title={target.label} className={buttonClass}>
            <SocialIcon platform={target.key} className="size-[18px]" />
          </button>
        ))}
        <button type="button" onClick={copy} aria-label="Salin tautan" title="Salin tautan" className={buttonClass}>
          <SocialIcon platform="lainnya" className="size-[18px]" />
        </button>
        {native ? (
          <button type="button" onClick={shareNative} aria-label="Bagikan lewat aplikasi lain" title="Aplikasi lain" className={buttonClass}>
            <SocialIcon platform="bagikan" className="size-[18px]" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

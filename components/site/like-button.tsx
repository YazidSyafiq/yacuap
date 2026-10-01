"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const VISITOR_KEY = "yacuap:pengunjung";

/** Penanda acak browser ini, dibuat sekali dan disimpan. Bukan data diri; hanya supaya satu browser satu suka. */
function visitorId() {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;
    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    // penyimpanan diblokir: sukanya tetap bisa, hanya tidak diingat setelah halaman dimuat ulang
    return crypto.randomUUID();
  }
}

type LikeState = { count: number; liked: boolean };

async function callLike(slug: string, visitor: string, setTo: boolean | null): Promise<LikeState | null> {
  const { data, error } = await createClient().rpc("post_like", { post_slug: slug, visitor_id: visitor, set_to: setTo });
  if (error || !data) return null;
  const result = data as Partial<LikeState>;
  return { count: Number(result.count ?? 0), liked: Boolean(result.liked) };
}

/**
 * Tombol Suka di akhir tulisan: hati dan jumlahnya. Tanpa akun; satu browser satu suka, bisa dibatalkan.
 * Halaman bacanya statis, jadi jumlah dan keadaan sukanya diambil di browser setelah halaman tampil.
 */
export function LikeButton({ slug }: { slug: string }) {
  const [state, setState] = useState<LikeState | null>(null);
  const [visitor, setVisitor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    const id = visitorId();
    void callLike(slug, id, null).then((result) => {
      if (!active) return;
      setVisitor(id);
      if (result) setState(result);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  async function toggle() {
    if (!visitor || !state || busy) return;
    const next = !state.liked;
    const previous = state;
    // langsung berubah di layar; kalau gagal disimpan, dikembalikan
    setState({ liked: next, count: Math.max(0, state.count + (next ? 1 : -1)) });
    setBusy(true);
    const result = await callLike(slug, visitor, next);
    setState(result ?? previous);
    setBusy(false);
  }

  const liked = state?.liked ?? false;
  const count = state?.count ?? 0;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        disabled={!state}
        aria-pressed={liked}
        aria-label={liked ? "Batal suka tulisan ini" : "Suka tulisan ini"}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
          liked ? "border-ink bg-ink text-bg" : "border-border-strong text-ink hover:border-ink",
        )}
      >
        <svg
          key={liked ? "suka" : "belum"}
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn("size-5", liked && "like-pop")}
        >
          <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />
        </svg>
      </button>
      <p className="font-ui text-sm" aria-live="polite">
        {state === null ? (
          <span className="text-muted">Suka tulisannya?</span>
        ) : count === 0 ? (
          <span className="text-muted">Belum ada yang suka. Jadi yang pertama, dong.</span>
        ) : (
          <>
            <span className="font-semibold tabular-nums">{new Intl.NumberFormat("id-ID").format(count)}</span>
            <span className="text-muted"> suka{liked ? ", termasuk kamu" : ""}</span>
          </>
        )}
      </p>
    </div>
  );
}

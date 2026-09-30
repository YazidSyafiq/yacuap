import { cn } from "@/lib/cn";

/**
 * Kotak abu berkedip pelan sebagai pengganti isi yang masih dimuat.
 * Dipakai di berkas loading.tsx tiap bagian, jadi halaman langsung punya bentuk saat berpindah.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-lg bg-line", className)} />;
}

/** Pembungkus yang memberi tahu pembaca layar bahwa isinya sedang dimuat. */
export function Loading({ label = "Lagi dimuat", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

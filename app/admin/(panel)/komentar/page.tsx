import type { Metadata } from "next";

export const metadata: Metadata = { title: "Komentar" };

export default function AdminKomentarPage() {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-display text-[2.125rem] font-medium">Komentar</h1>
      <p className="text-sm text-muted">Daftar komentar menyusul di Phase 4.</p>
    </div>
  );
}

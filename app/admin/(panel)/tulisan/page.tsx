import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tulisan" };

export default function AdminTulisanPage() {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-display text-[2.125rem] font-medium">Tulisan</h1>
      <p className="text-sm text-muted">Editor dan daftar tulisan menyusul di Phase 1.</p>
    </div>
  );
}

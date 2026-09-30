import type { Metadata } from "next";

export const metadata: Metadata = { title: "Playlist" };

export default function AdminPlaylistPage() {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="font-display text-[2.125rem] font-medium">Playlist</h1>
      <p className="text-sm text-muted">Pengelolaan playlist dan lagu menyusul di Phase 2.</p>
    </div>
  );
}

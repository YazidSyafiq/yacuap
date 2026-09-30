import { Card } from "@/components/ui/card";

const phases = [
  { name: "Tulisan", note: "Editor, draf, terbit. Menyusul di Phase 1." },
  { name: "Playlist", note: "Lagu, catatan, pemutar. Menyusul di Phase 2." },
  { name: "Komentar", note: "Balas, sembunyikan, hapus. Menyusul di Phase 4." },
];

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[2.125rem] font-medium">Ringkasan</h1>
        <p className="text-sm text-muted">Fondasi sudah terpasang. Bagian-bagian di bawah diisi per phase.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {phases.map((phase) => (
          <Card key={phase.name} className="flex flex-col gap-2 p-6">
            <h2 className="font-display text-xl font-medium">{phase.name}</h2>
            <p className="text-sm text-muted">{phase.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

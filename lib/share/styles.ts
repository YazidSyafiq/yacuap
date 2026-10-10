/** Gaya kartu chart yang bisa dipilih di pop up bagikan. Dipisah dari pembuat gambar supaya bisa dipakai di browser. */
export type ChartStyle = "koran" | "tiket";
export const CHART_STYLES: ReadonlyArray<{ key: ChartStyle; label: string }> = [
  { key: "koran", label: "Koran" },
  { key: "tiket", label: "Tiket" },
];

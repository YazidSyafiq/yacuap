import { AdminEditorSkeleton } from "@/components/admin/editor-skeleton";
import { Loading } from "@/components/ui/skeleton";

/** Kerangka Chart: kartu ringkasan gelap, lalu tabel editor dengan kolom minggu lalu. */
export default function ChartLoading() {
  return (
    <Loading>
      <AdminEditorSkeleton chart />
    </Loading>
  );
}

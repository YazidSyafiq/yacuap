import { AdminEditorSkeleton } from "@/components/admin/editor-skeleton";
import { Loading } from "@/components/ui/skeleton";

/** Kerangka satu playlist di admin: kartu ringkasan gelap dengan tombol terbit dan hapus, lalu tabel editor. */
export default function PlaylistLoading() {
  return (
    <Loading>
      <AdminEditorSkeleton />
    </Loading>
  );
}

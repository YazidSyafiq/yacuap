import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka daftar playlist: kepala halaman dengan tombol, kotak cari, lalu kisi kartu persegi dengan kaki tindakan. */
export default function PlaylistsLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader action />
        <Skeleton className="h-11 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <Skeleton className="h-3 w-28" />
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 3 }, (_, j) => (
                    <Skeleton key={j} className="size-10 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

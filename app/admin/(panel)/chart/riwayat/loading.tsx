import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka riwayat chart: kepala halaman dengan tombol, daftar minggu di kiri, tabel minggu terpilih di kanan. */
export default function ChartHistoryLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader action />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex gap-2 overflow-hidden lg:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[62px] w-44 shrink-0 rounded-2xl lg:w-full" />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-4 last:border-b-0">
                  <Skeleton className="h-7 w-9" />
                  <Skeleton className="size-14 rounded-lg sm:size-16" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Loading>
  );
}

import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Dashboard: sapaan, enam kartu angka, grafik dan daftar batang. */
export default function DashboardLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex h-52 items-end gap-2 px-5 py-4">
              {Array.from({ length: 14 }, (_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="flex flex-col gap-4 px-5 py-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Loading>
  );
}

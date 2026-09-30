import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Dashboard: sapaan, empat kartu angka, dua kartu daftar. */
export default function DashboardLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-7">
        <LoadingHeader />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface">
              <div className="border-b border-line px-5 py-4">
                <Skeleton className="h-5 w-44" />
              </div>
              <div className="px-5 py-1">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

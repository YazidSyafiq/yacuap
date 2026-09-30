import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Tulisan: saringan status lalu kisi kartu tiga sebaris. */
export default function TulisanLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader />
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <div className="flex flex-col gap-2.5 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

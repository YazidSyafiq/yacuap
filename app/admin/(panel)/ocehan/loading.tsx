import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Ocehan: kotak cari lalu kisi kartu empat sebaris. */
export default function OcehanLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader action />
        <Skeleton className="h-11 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-line bg-surface">
              <div className="flex flex-col gap-3 p-4 pt-6">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className={i % 3 === 0 ? "h-5 w-1/3" : "h-5 w-3/4"} />
                <Skeleton className="mt-2 h-0.5 w-6" />
              </div>
              <div className="flex items-center justify-between border-t border-line px-4 py-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

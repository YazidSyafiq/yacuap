import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Tag: kisi kartu tiga sebaris. */
export default function TagLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader action />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between border-t border-line pt-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

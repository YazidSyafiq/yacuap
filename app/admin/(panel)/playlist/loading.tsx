import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Playlist: ringkasan di kiri, daftar lagu di kanan. */
export default function PlaylistLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-6">
        <LoadingHeader action />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full rounded-full sm:w-40" />
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-2 sm:px-5 sm:py-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
                <Skeleton className="hidden h-4 w-6 sm:block" />
                <Skeleton className="size-12 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}

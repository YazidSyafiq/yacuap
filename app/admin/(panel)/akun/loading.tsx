import { LoadingHeader } from "@/components/admin/loading-header";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka Akun Saya: ringkasan dan ganti kata sandi di kiri, formulir profil di kanan. */
export default function AkunLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-7">
        <LoadingHeader />
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-6">
              <Skeleton className="size-24 rounded-[29px]" />
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <div className="mt-3 flex w-full flex-col gap-3 border-t border-line pt-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-xl" />
              ))}
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full rounded-full sm:w-[236px]" />
          </div>
        </div>
      </div>
    </Loading>
  );
}

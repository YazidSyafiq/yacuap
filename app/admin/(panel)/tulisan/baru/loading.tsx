import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka editor tulisan: baris atas, kartu tulis di kiri, kartu pengaturan di kanan. */
export default function EditorLoading() {
  return (
    <Loading>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-8">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="my-2 h-10 w-full" />
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-1/2" : "h-4 w-full"} />
            ))}
          </div>
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </div>
    </Loading>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kerangka blok playlist atau chart (PlaylistShowcase): kolom kiri sampul selebar kolom, lencana, judul, keterangan,
 * tombol putar; kolom kanan satu kartu berisi daftar lagu. Di HP semuanya bertumpuk, di laptop 4 banding 7.
 */
export function ShowcaseSkeleton({ chart = false, rows = 6 }: { chart?: boolean; rows?: number }) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-[26px] w-40 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-9 w-3/4 sm:h-10" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-11 w-full rounded-full" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        {/* kepala kolom hanya di laptop, seperti tabelnya */}
        <div className="hidden items-center gap-4 border-b border-line px-6 py-3 sm:flex">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="ml-20 h-3 w-10" />
          {chart ? <Skeleton className="ml-auto h-3 w-20" /> : <Skeleton className="ml-auto h-3 w-24" />}
        </div>
        <ol className="flex flex-col">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="flex flex-col gap-3.5 border-b border-line px-4 py-6 last:border-b-0 sm:flex-row sm:items-start sm:gap-4 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3 sm:contents">
                <Skeleton className="h-8 w-9 sm:h-16 sm:w-9" />
                <Skeleton className="size-14 shrink-0 rounded-xl sm:size-16" />
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:pt-1">
                  <Skeleton className="h-4 w-2/3 sm:w-1/2" />
                  <Skeleton className="h-3 w-1/3 sm:w-1/4" />
                  {i % 2 === 0 ? <Skeleton className="hidden h-3 w-3/4 sm:block" /> : null}
                </div>
                {chart ? (
                  <>
                    <Skeleton className="hidden h-16 w-20 sm:block" />
                    <Skeleton className="hidden h-16 w-16 sm:block" />
                  </>
                ) : (
                  <Skeleton className="hidden h-16 w-24 sm:block" />
                )}
              </div>
              {i % 2 === 0 ? <Skeleton className="h-4 w-11/12 sm:hidden" /> : null}
              <div className="flex items-center gap-2 sm:hidden">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

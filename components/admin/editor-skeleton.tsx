import { Skeleton } from "@/components/ui/skeleton";

/**
 * Kerangka halaman chart dan playlist di admin: kartu ringkasan gelap dengan ikon di pojok, lalu tabel editor
 * (kartu per lagu di HP, baris tabel di laptop) dan baris tambah lagu. Chart punya kolom minggu lalu dan lencana gerak.
 */
export function AdminEditorSkeleton({ chart = false, rows = 6 }: { chart?: boolean; rows?: number }) {
  const columns = chart ? "sm:[grid-template-columns:28px_72px_64px_minmax(0,1fr)_144px_158px]" : "sm:[grid-template-columns:28px_72px_64px_minmax(0,1fr)_158px]";
  return (
    <div className="flex flex-col gap-6">
      <div className="relative flex min-h-[260px] flex-col justify-end rounded-3xl bg-ink/90 p-5 pt-16 sm:p-7">
        <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          {Array.from({ length: chart ? 3 : 4 }, (_, i) => (
            <Skeleton key={i} className="size-10 rounded-full bg-bg/20" />
          ))}
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className={`h-[26px] rounded-full bg-bg/20 ${chart ? "w-44" : "w-16"}`} />
              <Skeleton className="h-3 w-20 bg-bg/20" />
              {chart ? <Skeleton className="h-3 w-40 bg-bg/20" /> : null}
            </div>
            <Skeleton className="h-8 w-60 bg-bg/20 sm:h-10 sm:w-72" />
            <Skeleton className="h-4 w-full max-w-[560px] bg-bg/20" />
            <div className="mt-1 flex items-center gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="size-10 bg-bg/20" />
              ))}
            </div>
          </div>
          {chart ? (
            <div className="flex shrink-0 items-center gap-6">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-8 w-16 bg-bg/20" />
                  <Skeleton className="h-3 w-14 bg-bg/20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Skeleton className="h-11 w-full rounded-full bg-bg/20 sm:w-[236px]" />
              <Skeleton className="h-11 w-full rounded-full bg-bg/20 sm:w-[236px]" />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className={`hidden items-center gap-6 border-b border-line px-4 py-3 sm:grid ${columns}`}>
          <span />
          <Skeleton className="h-3 w-12" />
          <span />
          <Skeleton className="h-3 w-10" />
          {chart ? <Skeleton className="mx-auto h-3 w-20" /> : null}
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
        <ol className="flex flex-col">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="border-b border-line">
              <div className="flex flex-col gap-3.5 px-4 py-5 sm:hidden">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-9" />
                  <Skeleton className="size-6 rounded" />
                  <Skeleton className="size-14 rounded-lg" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                {i % 2 === 0 ? <Skeleton className="h-4 w-11/12" /> : null}
                {chart ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                ) : null}
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }, (_, j) => (
                    <Skeleton key={j} className="h-10 w-full rounded-full" />
                  ))}
                </div>
              </div>
              <div className={`hidden items-start gap-6 px-4 py-4 sm:grid ${columns}`}>
                <Skeleton className="mt-5 size-6 rounded" />
                <div className="flex h-16 items-center gap-2.5">
                  <Skeleton className="h-7 w-9" />
                  <Skeleton className="h-10 w-5 rounded" />
                </div>
                <Skeleton className="size-16 rounded-lg" />
                <div className="flex max-w-[560px] flex-col gap-2 pt-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                  {i % 2 === 0 ? <Skeleton className="h-3 w-3/4" /> : null}
                </div>
                {chart ? (
                  <div className="flex h-16 flex-col items-center justify-center gap-1.5 pl-2">
                    <Skeleton className="h-7 w-8" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                ) : null}
                <div className="flex h-16 items-center justify-end gap-1.5">
                  {Array.from({ length: 3 }, (_, j) => (
                    <Skeleton key={j} className="size-10 rounded-full" />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-3 px-4 py-4">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
    </div>
  );
}

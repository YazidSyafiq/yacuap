import { ReadColumn } from "@/components/ui/container";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka halaman baca: tag, judul, penulis, cover, lalu baris-baris paragraf. */
export default function ReadLoading() {
  return (
    <Loading>
      <ReadColumn className="flex flex-col gap-5 py-10 md:py-14">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-11 w-full sm:h-14" />
        <Skeleton className="h-11 w-2/3 sm:h-14" />
        <Skeleton className="h-6 w-5/6" />
        <div className="flex items-center gap-3.5 pt-2">
          <Skeleton className="size-14 rounded-[17px]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="mt-5 aspect-[16/9] w-full rounded-2xl" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className={i % 4 === 3 ? "h-5 w-1/2" : "h-5 w-full"} />
          ))}
        </div>
      </ReadColumn>
    </Loading>
  );
}

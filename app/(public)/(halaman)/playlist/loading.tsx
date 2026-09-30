import { Container } from "@/components/ui/container";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka halaman playlist: kepala halaman, lalu sampul dan nama di kiri, daftar lagu di kanan. */
export default function PlaylistLoading() {
  return (
    <Loading>
      <Container className="flex flex-col gap-10 py-10 md:py-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-3/4 max-w-xl sm:h-16" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:gap-6">
              <Skeleton className="aspect-square w-28 shrink-0 rounded-2xl sm:w-40 lg:w-full lg:max-w-[380px] lg:rounded-3xl" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-48" />
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-full sm:w-[236px]" />
          </div>
          <div className="flex flex-col border-t border-line">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-line py-4 sm:gap-5">
                <Skeleton className="hidden h-5 w-7 sm:block" />
                <Skeleton className="size-14 rounded-xl sm:size-16" />
                <div className="flex flex-1 flex-col gap-2 pt-0.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Loading>
  );
}

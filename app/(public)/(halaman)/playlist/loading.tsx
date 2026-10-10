import { Container } from "@/components/ui/container";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka halaman semua playlist: kepala halaman, kartu chart melebar yang gelap, lalu judul bagian dan kisi kartu persegi. */
export default function PlaylistsLoading() {
  return (
    <Loading>
      <Container className="flex flex-col gap-10 py-10 md:py-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-3/4 max-w-xl sm:h-16" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <Skeleton className="h-5 w-2/3 max-w-md" />
        </div>

        {/* kartu chart: kotak gelap setinggi kartunya, isinya samar di bagian bawah */}
        <div className="flex min-h-[320px] flex-col justify-end rounded-3xl bg-ink/90 p-5 sm:min-h-[360px] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-[26px] w-44 rounded-full bg-bg/20" />
                <Skeleton className="h-3 w-20 bg-bg/20" />
              </div>
              <Skeleton className="h-10 w-64 bg-bg/20 sm:h-12 sm:w-80" />
              <Skeleton className="h-4 w-full max-w-[560px] bg-bg/20" />
              <div className="mt-1 flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="size-10 bg-bg/20 sm:size-12" />
                ))}
              </div>
            </div>
            <Skeleton className="h-11 w-full shrink-0 rounded-full bg-bg/20 lg:w-[236px]" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        </div>
      </Container>
    </Loading>
  );
}

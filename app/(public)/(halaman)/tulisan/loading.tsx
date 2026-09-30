import { Container } from "@/components/ui/container";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka daftar tulisan: kepala halaman, tab tag, kisi dua kartu sebaris. */
export default function StoriesLoading() {
  return (
    <Loading>
      <Container className="flex flex-col gap-8 py-10 md:py-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-3/4 max-w-xl sm:h-16" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex gap-7 border-b border-line pb-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[2/1] w-full rounded-2xl" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-7 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Loading>
  );
}

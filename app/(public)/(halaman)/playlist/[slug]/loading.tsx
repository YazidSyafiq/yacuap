import { ShowcaseSkeleton } from "@/components/site/playlist-skeleton";
import { Container } from "@/components/ui/container";
import { Loading, Skeleton } from "@/components/ui/skeleton";

/** Kerangka satu playlist: tautan kembali, kepala halaman, lalu blok playlist (sampul dan keterangan di kiri, daftar di kanan). */
export default function PlaylistDetailLoading() {
  return (
    <Loading>
      <Container className="flex flex-col gap-10 py-10 md:py-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-3/4 max-w-xl sm:h-16" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <ShowcaseSkeleton rows={6} />
      </Container>
    </Loading>
  );
}

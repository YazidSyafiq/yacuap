import { Skeleton } from "@/components/ui/skeleton";

/** Kerangka kepala halaman admin: judul, keterangan, dan tombol aksi di kanan (opsional). */
export function LoadingHeader({ action = false }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-11 w-full rounded-full sm:w-[236px]" /> : null}
    </div>
  );
}

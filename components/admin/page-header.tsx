/** Kepala halaman admin: judul, keterangan, dan aksi opsional di kanan. */
export function AdminPageHeader({
  title,
  note,
  action,
}: {
  title: string;
  note?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-[-0.01em] sm:text-[2.125rem]">
          {title}
        </h1>
        {note ? <p className="max-w-2xl font-ui text-[15px] text-muted">{note}</p> : null}
      </div>
      {/* di HP aksinya turun ke bawah judul; tombol di dalamnya sebaiknya memakai block="sm" */}
      {action ? <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">{action}</div> : null}
    </div>
  );
}

import type { ComponentType } from "react";
import { cn } from "@/lib/cn";

/** Kartu pembungkus formulir admin: kepala berisi ikon, judul, dan keterangan, lalu isinya, tanpa garis pemisah. */
export function FormCard({
  title,
  note,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  note?: string;
  icon?: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface", className)}>
      <div className="flex flex-col gap-1.5 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {Icon ? <Icon className="size-[18px] shrink-0 text-muted" /> : null}
          {title}
        </h2>
        {note ? <p className="text-sm text-muted">{note}</p> : null}
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}

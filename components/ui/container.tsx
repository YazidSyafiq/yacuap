import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Lebar situs (beranda, daftar). */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

/** Kolom baca 680px ala Medium. */
export function ReadColumn({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-read px-5 sm:px-0", className)} {...props} />;
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("font-ui text-xs font-semibold uppercase tracking-[0.1em] text-muted", className)}
      {...props}
    />
  );
}

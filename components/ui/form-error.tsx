import { cn } from "@/lib/cn";

/** Ikon tanda seru dalam lingkaran, ikut warna tulisannya. */
function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

/**
 * Pesan galat. Satu-satunya tempat situs ini memakai warna: merah dengan ikon, supaya tidak terlewat.
 * - `field`: baris kecil di bawah isian yang salah.
 * - `box` (bawaan): kotak untuk galat formulir secara keseluruhan, misalnya "Email atau kata sandi salah."
 */
export function FormError({
  children,
  variant = "box",
  id,
  className,
}: {
  children: React.ReactNode;
  variant?: "box" | "field";
  id?: string;
  className?: string;
}) {
  if (variant === "field") {
    return (
      <p id={id} className={cn("flex items-start gap-1.5 font-ui text-[13px] font-medium text-danger", className)}>
        <AlertIcon className="mt-px size-4 shrink-0" />
        <span>{children}</span>
      </p>
    );
  }
  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] border border-danger/40 bg-danger/10 px-3.5 py-2.5 font-ui text-sm font-medium text-danger",
        className,
      )}
    >
      <AlertIcon className="mt-px size-[18px] shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Kelas tambahan untuk isian yang salah: garis tepinya ikut merah. */
export const invalidField = "border-danger focus-visible:outline-danger";

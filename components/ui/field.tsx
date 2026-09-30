import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-[10px] border border-border-strong bg-surface px-3.5 text-ink placeholder:text-muted";

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="font-ui text-[13px] font-semibold text-ink-soft">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-11 font-ui text-[15px]", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "py-3 font-body text-[17px] leading-normal", className)} {...props} />;
}

/** Dropdown bergaya sama dengan isian lain, dengan kotak panah kecil di kanan supaya jelas bisa dibuka. */
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(control, "h-11 appearance-none pr-11 font-ui text-[15px] hover:border-ink/40", className)}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-ink/10 text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}

"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/**
 * Tombol kirim formulir: selama formulirnya diproses, tombolnya mati (supaya tidak terkirim dua kali)
 * dan menampilkan lingkaran berputar di depan tulisannya.
 */
export function SubmitButton({ disabled, children, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-4 shrink-0 animate-spin">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
          <path d="M20.5 12a8.5 8.5 0 0 0-8.5-8.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : null}
      {children}
    </Button>
  );
}

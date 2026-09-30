"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** Tombol kirim formulir: mati selama formulirnya sedang diproses, supaya tidak terkirim dua kali. */
export function SubmitButton({ disabled, ...props }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props} />;
}

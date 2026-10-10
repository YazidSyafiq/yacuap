"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/field";
import { FormError, invalidField } from "@/components/ui/form-error";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { changePassword } from "./actions";
import { useRequired } from "@/components/ui/use-required";

/** Gayanya sama dengan formulir di halaman masuk: isian bertombol mata, pesan merah di bawah isian, tombol selebar formulir. */
export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const wrong = (field: "current" | "next" | "confirm") => state?.field === field;
  const required = useRequired({ current: "Kata sandi sekarangnya diisi dulu.", next: "Kata sandi barunya diisi dulu.", confirm: "Ulangi kata sandi barunya dulu." });

  return (
    <form action={action} onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="current">Kata Sandi Sekarang</Label>
        <PasswordInput id="current" name="current" autoComplete="current-password" required {...required.field("current")} className={cn(wrong("current") && invalidField, required.field("current").className)} />
        {required.error("current") ?? (wrong("current") ? <FormError variant="field">{state?.error}</FormError> : null)}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="next">Kata Sandi Baru</Label>
        <PasswordInput id="next" name="next" autoComplete="new-password" required minLength={8} {...required.field("next")} className={cn(wrong("next") && invalidField, required.field("next").className)} />
        {required.error("next") ?? (wrong("next") ? (
          <FormError variant="field">{state?.error}</FormError>
        ) : (
          <p className="text-[13px] text-muted">Minimal 8 karakter.</p>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Ulangi Kata Sandi Baru</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required {...required.field("confirm")} className={cn(wrong("confirm") && invalidField, required.field("confirm").className)} />
        {required.error("confirm") ?? (wrong("confirm") ? <FormError variant="field">{state?.error}</FormError> : null)}
      </div>
      {state?.error && !state.field ? <FormError>{state.error}</FormError> : null}
      {state?.ok ? (
        <p role="status" className="rounded-[10px] border border-line bg-bg px-3.5 py-2.5 text-sm font-medium">
          {state.ok}
        </p>
      ) : null}
      <SubmitButton block className="mt-1">
        Ganti kata sandi
      </SubmitButton>
    </form>
  );
}

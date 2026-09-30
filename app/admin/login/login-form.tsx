"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { FormError, invalidField } from "@/components/ui/form-error";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/cn";
import { signIn, type LoginState } from "../actions";

type FieldErrors = { email?: string; password?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const error = state?.error ?? initialError;

  // Isian diperiksa di sini dulu supaya pesannya muncul tepat di bawah isian yang salah;
  // kalau ada yang salah, formulir tidak dikirim.
  const validate = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const errors: FieldErrors = {};
    if (!email) errors.email = "Emailnya diisi dulu.";
    else if (!EMAIL.test(email)) errors.email = "Format emailnya belum benar.";
    if (!password) errors.password = "Kata sandinya diisi dulu.";
    setFieldErrors(errors);
    if (errors.email || errors.password) event.preventDefault();
  };

  const clear = (key: keyof FieldErrors) => {
    if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  return (
    <form action={action} onSubmit={validate} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="kamu@email.com"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          onChange={() => clear("email")}
          className={cn("rounded-xl px-4", fieldErrors.email && invalidField)}
        />
        {fieldErrors.email ? (
          <FormError variant="field" id="email-error">
            {fieldErrors.email}
          </FormError>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Kata Sandi</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          onChange={() => clear("password")}
          className={cn(fieldErrors.password && invalidField)}
        />
        {fieldErrors.password ? (
          <FormError variant="field" id="password-error">
            {fieldErrors.password}
          </FormError>
        ) : null}
      </div>
      {error ? (
        <FormError>{error}</FormError>
      ) : null}
      <Button type="submit" disabled={pending} block className="mt-1">
        {pending ? "Bentar..." : "Masuk"}
      </Button>
    </form>
  );
}

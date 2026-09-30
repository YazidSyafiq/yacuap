"use client";

import { useActionState, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { FormError, invalidField } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import { signIn, type LoginState } from "../actions";

type FieldErrors = { email?: string; password?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, undefined);
  const [visible, setVisible] = useState(false);
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
          className={cn(fieldErrors.email && invalidField)}
        />
        {fieldErrors.email ? (
          <FormError variant="field" id="email-error">
            {fieldErrors.email}
          </FormError>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            onChange={() => clear("password")}
            className={cn("pr-11", fieldErrors.password && invalidField)}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            title={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={visible}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-[18px]"
            >
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {/* garis coret saat kata sandi sedang terlihat */}
              {visible ? <path d="M4 4l16 16" /> : null}
            </svg>
          </button>
        </div>
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

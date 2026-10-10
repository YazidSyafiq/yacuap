"use client";

import { useState, type FormEvent } from "react";
import { FormError, invalidField } from "@/components/ui/form-error";

/**
 * Pemeriksaan isian wajib di browser dengan gaya halaman masuk, menggantikan gelembung bawaan browser.
 * Pakai bersama `noValidate` di <form>: `onSubmit` menahan pengiriman kalau ada isian kosong dan menandai
 * isiannya; `field(name)` memberi atribut untuk isian itu; `error(name)` menampilkan pesannya di bawah isian.
 * Hanya isian yang sedang ada di formulir yang diperiksa (misalnya isian yang tampil per mode).
 */
export function useRequired(messages: Record<string, string>) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const found: Record<string, string> = {};
    for (const [name, message] of Object.entries(messages)) {
      if (!form.querySelector(`[name="${name}"]`)) continue;
      if (!String(data.get(name) ?? "").trim()) found[name] = message;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      event.preventDefault();
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
    }
  };

  const clear = (name: string) => {
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  const field = (name: string) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onInput: () => clear(name),
    className: errors[name] ? invalidField : undefined,
  });

  const error = (name: string) =>
    errors[name] ? (
      <FormError variant="field" id={`${name}-error`}>
        {errors[name]}
      </FormError>
    ) : null;

  return { errors, onSubmit, field, error, clear };
}

"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TrackOption } from "@/lib/admin/tracks";
import { cn } from "@/lib/cn";
import { useRequired } from "@/components/ui/use-required";

export type AddTrackState = { error?: string; ok?: string } | undefined;

/**
 * Pop up tambah lagu ke playlist atau chart. Dua jalan: pilih dari lagu yang sudah ada (di playlist mana pun
 * atau di chart), atau tempel tautan YouTube baru. `action` menerima `trackId` (jalan pertama) atau `url` (jalan kedua),
 * ditambah `note` dan isian tersembunyi dari `hidden`. Tertutup sendiri kalau berhasil.
 */
export function AddTrackModal({
  title = "Tambah Lagu",
  options,
  exclude,
  hidden = {},
  action,
  onClose,
}: {
  title?: string;
  /** Semua lagu yang sudah tersimpan. */
  options: TrackOption[];
  /** Id lagu yang sudah ada di tujuan, tidak ditawarkan lagi. */
  exclude: Set<string>;
  hidden?: Record<string, string>;
  action: (prev: AddTrackState, formData: FormData) => Promise<AddTrackState>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "url">(options.some((option) => !exclude.has(option.id)) ? "existing" : "url");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const required = useRequired({ url: "Tautan YouTube-nya diisi dulu." });
  const [state, submit] = useActionState<AddTrackState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);

  const q = query.trim().toLowerCase();
  const candidates = options.filter((option) => !exclude.has(option.id) && (!q || `${option.title} ${option.artist}`.toLowerCase().includes(q)));

  return (
    <Modal open onClose={onClose} title={title} note="Pilih dari lagu yang sudah ada, atau tempel tautan YouTube: judul, artis, dan sampulnya diambil otomatis.">
      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Sumber lagu" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
          {(
            [
              ["existing", "Dari yang sudah ada"],
              ["url", "Tautan YouTube"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={cn("flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium", mode === key ? "bg-ink text-surface" : "text-muted hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>

        <form action={submit} onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
          {Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          {mode === "existing" ? (
            <>
              <input type="hidden" name="trackId" value={picked ?? ""} />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="track-search">Cari Lagu</Label>
                <Input id="track-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Judul atau artis" autoFocus />
              </div>
              <ul className="flex max-h-64 flex-col overflow-y-auto rounded-xl border border-line">
                {candidates.length === 0 ? (
                  <li className="px-3 py-4 text-sm text-muted">{options.length === 0 ? "Belum ada lagu tersimpan. Pakai tautan YouTube." : "Tidak ada yang cocok, atau semuanya sudah masuk."}</li>
                ) : (
                  candidates.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(option.id)}
                        aria-pressed={picked === option.id}
                        className={cn("flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-bg", picked === option.id && "bg-bg")}
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-(--cover)">
                          {option.artwork ? <Image src={option.artwork} alt="" fill sizes="40px" unoptimized className="mono-img object-cover" /> : null}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[14px] font-semibold">{option.title}</span>
                          <span className="truncate text-[12px] text-muted">{option.artist || "Artis belum diisi"}</span>
                        </span>
                        {picked === option.id ? <span className="ml-auto shrink-0 font-ui text-xs font-semibold">Dipilih</span> : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="url">Tautan YouTube Lagunya</Label>
              <Input id="url" name="url" required autoFocus inputMode="url" placeholder="https://www.youtube.com/watch?v=..." {...required.field("url")} />
              {required.error("url")}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-note">Kenapa Lagu Ini Masuk?</Label>
            <Textarea id="add-note" name="note" rows={2} maxLength={400} placeholder="Boleh dikosongin, bisa diisi belakangan." />
          </div>
          {state?.error ? <FormError>{state.error}</FormError> : null}
          <div className="grid gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
            <Button variant="secondary" size="sm" block onClick={onClose}>
              Batal
            </Button>
            <SubmitButton size="sm" block disabled={mode === "existing" && !picked}>
              Tambah
            </SubmitButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}

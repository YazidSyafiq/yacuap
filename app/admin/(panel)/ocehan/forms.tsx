"use client";

import { useActionState, useState } from "react";
import { PenIcon, SearchIcon, TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { createQuip, deleteQuip, updateQuip, type FormState } from "./actions";

const MAX = 140;

export type Quip = { id: string; body: string; createdAt: string };

/** Pop up tambah atau ubah ocehan. `quip` terisi berarti mengubah. Tertutup sendiri kalau berhasil disimpan. */
function QuipModal({ quip, open, onClose }: { quip: Quip | null; open: boolean; onClose: () => void }) {
  const [length, setLength] = useState(quip?.body.length ?? 0);
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = quip ? await updateQuip(prev, formData) : await createQuip(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);
  const editing = Boolean(quip);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Ubah Ocehan" : "Tambah Ocehan"}
      note={editing ? "Perubahannya langsung tampil di beranda." : "Sebaris aja, maksimal 140 karakter. Langsung tampil begitu disimpan."}
    >
      <form action={action} className="flex flex-col gap-3">
        {quip ? <input type="hidden" name="id" value={quip.id} /> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quip-body">Ocehan</Label>
          <Textarea
            id="quip-body"
            name="body"
            rows={3}
            required
            autoFocus
            maxLength={MAX}
            defaultValue={quip?.body ?? ""}
            placeholder="Nggak perlu penting, yang penting kepikiran."
            onChange={(event) => setLength(event.target.value.length)}
          />
          <p className={cn("text-right text-xs tabular-nums", length > MAX ? "font-semibold text-danger" : "text-muted")}>
            {length}/{MAX}
          </p>
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" block="sm" onClick={onClose}>
            Batal
          </Button>
          <SubmitButton size="sm" block="sm">
            {editing ? "Simpan" : "Tambah"}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

/** Pop up konfirmasi hapus: menampilkan ocehannya, tombol Batal dan Hapus. */
function DeleteModal({ quip, onClose }: { quip: Quip; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Hapus Ocehan?" note="Yang sudah dihapus nggak bisa dibalikin." danger>
      <form action={deleteQuip} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={quip.id} />
        <blockquote className="rounded-xl border border-line bg-bg px-4 py-3 font-display text-[17px] font-semibold leading-snug">
          {quip.body}
        </blockquote>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" block="sm" onClick={onClose}>
            Batal
          </Button>
          <SubmitButton variant="danger" size="sm" block="sm">
            Hapus
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Satu ocehan, sama persis dengan pop up ocehan di beranda (components/site/ocehan-wave.tsx),
 * hanya ukurannya yang diperkecil supaya empat kartu muat sebaris:
 * label "Ocehan" dengan tanda kutip raksasa pudar di belakangnya, teks tebal, garis aksen.
 * Kaki kartu (tanggal, tombol) selalu di bawah, jadi kartu sebaris rata tingginya.
 */
function QuipCard({ quip, dateLabel, onEdit, onDelete }: { quip: Quip; dateLabel: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <figure className="relative flex-1 overflow-hidden px-4 pb-4 pt-6">
        {/* tanda kutip raksasa pudar tepat di belakang label "Ocehan": labelnya menimpa tanda kutipnya */}
        <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1 select-none font-display text-[6rem] leading-none text-ink/12">
          &ldquo;
        </span>
        <div className="relative flex h-full flex-col gap-2">
          <p className="pl-3 font-ui text-[9px] font-semibold uppercase tracking-[0.18em] text-ink">Ocehan</p>
          <blockquote className="font-display text-[18px] font-semibold leading-[1.2] tracking-tight">{quip.body}</blockquote>
          <span className="mt-auto h-0.5 w-6 rounded-full bg-ink" />
        </div>
      </figure>
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2">
        <p className="text-xs text-muted">{dateLabel}</p>
        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Ubah ocehan"
            title="Ubah"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink"
          >
            <PenIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Hapus ocehan"
            title="Hapus"
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-danger"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

/** Seluruh halaman Ocehan: kepala dengan tombol tambah, kotak cari, kisi empat ocehan sebaris, dan pop up tambah/ubah. */
export function OcehanManager({ quips, dates }: { quips: Quip[]; dates: Record<string, string> }) {
  const [query, setQuery] = useState("");
  // null: tertutup; { quip: null }: tambah; { quip }: ubah; { quip, remove: true }: konfirmasi hapus
  const [modal, setModal] = useState<{ quip: Quip | null; remove?: boolean } | null>(null);
  const needle = query.trim().toLowerCase();
  const shown = needle ? quips.filter((quip) => quip.body.toLowerCase().includes(needle)) : quips;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Ocehan"
        note={`${quips.length} kalimat sebaris yang nggak penting tapi kepikiran. Tampil di bagian Ocehan dan di balon-balon kerumunan beranda.`}
        action={<Button block="sm" onClick={() => setModal({ quip: null })}>Tambah Ocehan</Button>}
      />

      <div className="relative w-full">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari ocehan..."
          aria-label="Cari ocehan"
          className="pl-10"
        />
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-[15px] text-muted">
          {quips.length === 0 ? "Belum ada ocehan. Tambah satu lewat tombol di atas." : "Nggak ada ocehan yang cocok."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((quip) => (
            <QuipCard
              key={quip.id}
              quip={quip}
              dateLabel={dates[quip.id]}
              onEdit={() => setModal({ quip })}
              onDelete={() => setModal({ quip, remove: true })}
            />
          ))}
        </ul>
      )}

      {/* key mengikuti ocehan yang dibuka, supaya isian, penghitung, dan pesannya selalu segar */}
      {modal?.remove && modal.quip ? (
        <DeleteModal key={`hapus-${modal.quip.id}`} quip={modal.quip} onClose={() => setModal(null)} />
      ) : modal ? (
        <QuipModal key={modal.quip?.id ?? "baru"} quip={modal.quip} open onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}

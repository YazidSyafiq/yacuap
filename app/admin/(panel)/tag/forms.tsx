"use client";

import { useActionState, useState } from "react";
import { PenIcon, TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/ui/chip";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { createTag, deleteTag, updateTag, type FormState } from "./actions";

export type Tag = { id: string; name: string; slug: string; description: string; position: number; count: number };

const iconButton = "flex size-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink";

function ModalActions({ onClose, submit, danger = false }: { onClose: () => void; submit: string; danger?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button variant="secondary" size="sm" block="sm" onClick={onClose}>
        Batal
      </Button>
      <SubmitButton size="sm" block="sm" variant={danger ? "danger" : "primary"}>
        {submit}
      </SubmitButton>
    </div>
  );
}

/** Pop up tambah atau ubah tag. `tag` terisi berarti mengubah; alamat tag tidak ikut berubah. */
function TagModal({ tag, onClose }: { tag: Tag | null; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = tag ? await updateTag(prev, formData) : await createTag(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={tag ? "Ubah Tag" : "Tambah Tag"}
      note={tag ? `Alamatnya tetap /${tag.slug} walau namanya diganti, supaya tautan lama tidak putus.` : "Tag baru langsung punya halaman sendiri dan muncul di tab daftar tulisan."}
    >
      <form action={action} className="flex flex-col gap-4">
        {tag ? <input type="hidden" name="id" value={tag.id} /> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-name">Nama Tag</Label>
          <Input id="tag-name" name="name" required autoFocus maxLength={30} defaultValue={tag?.name ?? ""} placeholder="Misalnya: Jalan-jalan" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-description">Keterangan Singkat</Label>
          <Textarea
            id="tag-description"
            name="description"
            rows={2}
            maxLength={160}
            defaultValue={tag?.description ?? ""}
            placeholder="Tampil di halaman tagnya. Boleh dikosongin."
          />
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit={tag ? "Simpan" : "Tambah"} />
      </form>
    </Modal>
  );
}

/** Pop up konfirmasi hapus tag. */
function DeleteTagModal({ tag, onClose }: { tag: Tag; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Hapus Tag?"
      note={tag.count > 0 ? `Tag ini dilepas dari ${tag.count} tulisan. Tulisannya sendiri tidak ikut terhapus.` : "Tag ini belum dipakai tulisan mana pun."}
      danger
    >
      <form action={deleteTag} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={tag.id} />
        <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
          <TagChip tag={tag} />
          <span className="text-sm text-muted">/{tag.slug}</span>
        </div>
        <ModalActions onClose={onClose} submit="Hapus" danger />
      </form>
    </Modal>
  );
}

/** Satu kartu tag: chip besar (gaya yang sama seperti di situs), nama, alamat, keterangan, jumlah tulisan, tombol ubah dan hapus. */
function TagCard({ tag, onEdit, onDelete }: { tag: Tag; onEdit: () => void; onDelete: () => void }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <TagChip tag={tag} className="self-start px-4 py-2 text-[13px]" />
      <div className="flex flex-col gap-0.5">
        <h2 className="font-display text-[22px] font-medium leading-tight">{tag.name}</h2>
        <p className="text-[13px] text-muted">/{tag.slug}</p>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-muted">{tag.description || "Belum ada keterangan."}</p>
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-[13px] tabular-nums text-muted">{tag.count} tulisan</p>
        <div className="-mr-2 flex items-center">
          <button type="button" onClick={onEdit} aria-label={`Ubah tag ${tag.name}`} title="Ubah" className={iconButton}>
            <PenIcon className="size-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label={`Hapus tag ${tag.name}`} title="Hapus" className={cn(iconButton, "hover:text-danger")}>
            <TrashIcon className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

type ModalState = { kind: "add" } | { kind: "edit"; tag: Tag } | { kind: "delete"; tag: Tag } | null;

/** Seluruh halaman Tag: kepala dengan tombol tambah, kisi kartu tag tiga sebaris, dan pop up tambah, ubah, hapus. */
export function TagManager({ tags }: { tags: Tag[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tag"
        note="Tag mengelompokkan tulisan. Tiap tag punya halaman sendiri dan muncul sebagai tab di daftar tulisan. Satu tulisan boleh punya lebih dari satu tag."
        action={<Button block="sm" onClick={() => setModal({ kind: "add" })}>Tambah Tag</Button>}
      />

      {tags.length === 0 ? (
        <p className="py-6 text-[15px] text-muted">Belum ada tag. Tambah lewat tombol di atas.</p>
      ) : null}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tags.map((tag) => (
          <TagCard key={tag.id} tag={tag} onEdit={() => setModal({ kind: "edit", tag })} onDelete={() => setModal({ kind: "delete", tag })} />
        ))}
      </ul>

      {modal?.kind === "add" ? <TagModal tag={null} onClose={close} /> : null}
      {modal?.kind === "edit" ? <TagModal key={modal.tag.id} tag={modal.tag} onClose={close} /> : null}
      {modal?.kind === "delete" ? <DeleteTagModal key={modal.tag.id} tag={modal.tag} onClose={close} /> : null}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { createTag, deleteTag, updateTag } from "./actions";

export function NewTagForm() {
  const [state, action] = useActionState(createTag, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-tag-name">Nama tag</Label>
        <Input id="new-tag-name" name="name" required maxLength={30} placeholder="Misalnya: Jalan-jalan" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-tag-description">Keterangan singkat</Label>
        <Textarea
          id="new-tag-description"
          name="description"
          rows={2}
          maxLength={160}
          placeholder="Tampil di halaman tagnya. Boleh dikosongin."
        />
      </div>
      {state?.error ? <FormError>{state.error}</FormError> : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-muted">
          {state.ok}
        </p>
      ) : null}
      <SubmitButton>Tambah tag</SubmitButton>
    </form>
  );
}

/** Satu tag: nama dan keterangan bisa diubah, atau tagnya dihapus (ditanya dulu). */
export function TagForm({
  tag,
}: {
  tag: { id: string; name: string; slug: string; description: string; count: number };
}) {
  return (
    <form action={updateTag} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={tag.id} />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`name-${tag.id}`}>Nama</Label>
          <Input id={`name-${tag.id}`} name="name" required maxLength={30} defaultValue={tag.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`description-${tag.id}`}>Keterangan</Label>
          <Input id={`description-${tag.id}`} name="description" maxLength={160} defaultValue={tag.description} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton size="sm">Simpan</SubmitButton>
        <SubmitButton
          size="sm"
          variant="secondary"
          formAction={deleteTag}
          formNoValidate
          onClick={(event) => {
            const note = tag.count > 0 ? ` Tag ini akan dilepas dari ${tag.count} tulisan.` : "";
            if (!window.confirm(`Hapus tag "${tag.name}"?${note}`)) event.preventDefault();
          }}
        >
          Hapus
        </SubmitButton>
        <span className="flex-1" />
        <span className="text-[13px] text-muted">
          /{tag.slug} · {tag.count} tulisan
        </span>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteComment } from "../actions";

export type AdminComment = { id: string; name: string; body: string; dateLabel: string };

/** Komentar pembaca untuk tulisan ini, di bawah editor. Admin hanya bisa menghapus (ditanya dulu). */
export function CommentAdmin({ comments }: { comments: AdminComment[] }) {
  const [target, setTarget] = useState<AdminComment | null>(null);

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold">
          Komentar Pembaca <span className="font-normal text-muted">({comments.length})</span>
        </h2>
      </div>
      {comments.length === 0 ? (
        <p className="px-5 py-5 text-sm text-muted">Belum ada komentar di tulisan ini.</p>
      ) : (
        <ul className="px-5 py-1">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3 border-b border-line py-3.5 last:border-b-0">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm">
                  <span className="font-semibold">{comment.name}</span>
                  <span className="text-muted"> · {comment.dateLabel}</span>
                </p>
                <p className="whitespace-pre-line font-body text-[16px] leading-snug">{comment.body}</p>
              </div>
              <button type="button" onClick={() => setTarget(comment)} aria-label="Hapus komentar" title="Hapus" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-danger">
                <TrashIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {target ? (
        <Modal open onClose={() => setTarget(null)} title="Hapus Komentar?" note="Komentarnya hilang dari halaman baca." danger>
          <form action={deleteComment} onSubmit={() => setTarget(null)} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={target.id} />
            <blockquote className="rounded-xl border border-line bg-bg px-4 py-3 text-sm">
              <span className="font-semibold">{target.name}:</span> {target.body}
            </blockquote>
            <div className="grid gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
              <Button variant="secondary" size="sm" block onClick={() => setTarget(null)}>
                Batal
              </Button>
              <SubmitButton size="sm" block variant="danger">
                Hapus
              </SubmitButton>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

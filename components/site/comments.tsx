"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { createComment } from "@/app/(public)/(halaman)/tulisan/[slug]/actions";
import { useRequired } from "@/components/ui/use-required";

export type CommentItem = { id: string; name: string; body: string; dateLabel: string };

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** Komentar di bawah tulisan: daftar yang sudah ada, lalu formulir. Tanpa akun, langsung tampil. */
export function Comments({ postId, slug, comments }: { postId: string; slug: string; comments: CommentItem[] }) {
  const [state, action] = useActionState(createComment, undefined);
  const required = useRequired({ name: "Namanya diisi dulu.", body: "Komentarnya diisi dulu." });

  return (
    <section id="komentar" className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
        <h2 className="font-display text-2xl font-medium">
          Komentar <span className="text-muted">({comments.length})</span>
        </h2>
      </div>

      {comments.length === 0 ? (
        <p className="text-[17px] text-muted">Belum ada yang komentar. Mau jadi yang pertama?</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink font-ui text-sm font-semibold text-bg">
                {initial(comment.name)}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-ui text-sm">
                  <span className="font-semibold">{comment.name}</span>
                  <span className="text-muted"> · {comment.dateLabel}</span>
                </p>
                <p className="whitespace-pre-line text-[17px] leading-relaxed">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={action} onSubmit={required.onSubmit} noValidate className="relative flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="slug" value={slug} />
        {/* jebakan bot: disembunyikan dari manusia, bot biasanya mengisinya */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <p className="font-display text-xl">Mau komentar?</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comment-name">Nama</Label>
          <Input id="comment-name" name="name" required maxLength={60} placeholder="Nama panggilan juga boleh" autoComplete="nickname" {...required.field("name")} />
          {required.error("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comment-body">Komentar</Label>
          <Textarea id="comment-body" name="body" required rows={4} maxLength={2000} placeholder="Tulis aja, nggak perlu akun." {...required.field("body")} />
          {required.error("body")}
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        {state?.ok ? (
          <p role="status" className="text-sm text-muted">
            Makasih, komentarnya sudah masuk.
          </p>
        ) : null}
        <SubmitButton block="sm">Kirim komentar</SubmitButton>
      </form>
    </section>
  );
}

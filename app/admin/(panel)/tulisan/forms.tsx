"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArchiveIcon, EyeIcon, PenIcon, PublishIcon, SearchIcon, TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button, buttonClass } from "@/components/ui/button";
import { TagChip } from "@/components/ui/chip";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { deletePost, setPostStatus } from "./actions";

export type PostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string | null;
  published: boolean;
  dateLabel: string;
  tags: { id: string; name: string; position: number }[];
};

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "terbit", label: "Terbit" },
  { key: "draf", label: "Draf" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const iconButton = "flex size-9 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink";

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

function PostSummary({ post }: { post: PostItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
      <span className="relative aspect-[16/10] w-20 shrink-0 overflow-hidden rounded-lg bg-(--cover)">
        {post.cover ? <Image src={post.cover} alt="" fill sizes="80px" unoptimized className="mono-img object-cover" /> : null}
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{post.title || "Tanpa judul"}</p>
        <p className="text-xs text-muted">{post.published ? "Terbit" : "Draf"} · {post.dateLabel}</p>
      </div>
    </div>
  );
}

/** Pop up konfirmasi terbit atau tarik ke draf. */
function StatusModal({ post, onClose }: { post: PostItem; onClose: () => void }) {
  const publish = !post.published;
  return (
    <Modal
      open
      onClose={onClose}
      title={publish ? "Terbitkan Tulisan?" : "Tarik ke Draf?"}
      note={
        publish
          ? post.title
            ? "Begitu terbit, tulisannya langsung bisa dibaca semua orang."
            : "Judulnya masih kosong. Isi dulu lewat Ubah sebelum diterbitkan."
          : "Tulisannya hilang dari situs sampai diterbitkan lagi. Isinya tidak hilang."
      }
    >
      <form action={setPostStatus} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="status" value={publish ? "published" : "draft"} />
        <PostSummary post={post} />
        <ModalActions onClose={onClose} submit={publish ? "Terbitkan" : "Tarik ke Draf"} />
      </form>
    </Modal>
  );
}

/** Pop up konfirmasi hapus tulisan. */
function DeleteModal({ post, onClose }: { post: PostItem; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Hapus Tulisan?" note="Yang sudah dihapus nggak bisa dibalikin, termasuk isinya." danger>
      <form action={deletePost} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={post.id} />
        <PostSummary post={post} />
        <ModalActions onClose={onClose} submit="Hapus" danger />
      </form>
    </Modal>
  );
}

/** Satu kartu tulisan: cover dengan lencana status, tag, judul, ringkasan, tanggal, lalu Ubah dan tombol ikon (terbit/draf, lihat, hapus). */
function PostCard({ post, onStatus, onDelete }: { post: PostItem; onStatus: () => void; onDelete: () => void }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative aspect-[16/9] bg-(--cover)">
        {post.cover ? (
          <Image src={post.cover} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" unoptimized className="mono-img object-cover" />
        ) : null}
        <span
          className={cn(
            "absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            post.published ? "bg-ink text-surface" : "border border-border-strong bg-surface text-ink",
          )}
        >
          <span className={cn("size-1.5 rounded-full", post.published ? "bg-surface" : "bg-muted")} />
          {post.published ? "Terbit" : "Draf"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        ) : null}
        <h2 className="line-clamp-2 text-[17px] font-semibold leading-snug">{post.title || "Tanpa judul"}</h2>
        {post.excerpt ? <p className="line-clamp-2 text-sm text-muted">{post.excerpt}</p> : null}
        <p className="mt-auto pt-1 text-[13px] text-muted">{post.dateLabel}</p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <Link href={`/admin/tulisan/${post.id}`} className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-bg">
          <PenIcon className="size-[18px]" />
          Ubah
        </Link>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onStatus}
            aria-label={post.published ? "Tarik ke draf" : "Terbitkan"}
            title={post.published ? "Tarik ke draf" : "Terbitkan"}
            className={iconButton}
          >
            {post.published ? <ArchiveIcon className="size-[18px]" /> : <PublishIcon className="size-[18px]" />}
          </button>
          {post.published ? (
            <Link href={`/tulisan/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Lihat di situs" title="Lihat di situs" className={iconButton}>
              <EyeIcon className="size-[18px]" />
            </Link>
          ) : null}
          <button type="button" onClick={onDelete} aria-label="Hapus tulisan" title="Hapus" className={cn(iconButton, "hover:text-danger")}>
            <TrashIcon className="size-[18px]" />
          </button>
        </div>
      </div>
    </li>
  );
}

type ModalState = { kind: "status"; post: PostItem } | { kind: "delete"; post: PostItem } | null;

/** Seluruh halaman Tulisan: kepala, saringan status dan kotak cari, kisi kartu, pop up. */
export function PostManager({ posts }: { posts: PostItem[] }) {
  const [filter, setFilter] = useState<Filter>("semua");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  const counts = {
    semua: posts.length,
    terbit: posts.filter((post) => post.published).length,
    draf: posts.filter((post) => !post.published).length,
  };
  const needle = query.trim().toLowerCase();
  const shown = posts.filter(
    (post) =>
      (filter === "semua" || (filter === "terbit" ? post.published : !post.published)) &&
      (!needle || post.title.toLowerCase().includes(needle) || post.excerpt.toLowerCase().includes(needle)),
  );

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Tulisan"
        note={`${counts.terbit} terbit, ${counts.draf} draf. Yang terbit langsung bisa dibaca di situs; draf hanya terlihat di sini.`}
        action={
          // membuka editor kosong saja; tulisannya baru dibuat saat pertama kali disimpan
          <Link href="/admin/tulisan/baru" className={buttonClass("primary", "md", undefined, "sm")}>
            Tulis Baru
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <nav aria-label="Saring menurut status" className="flex gap-2">
          {FILTERS.map(({ key, label }) => {
            const active = key === filter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium",
                  active ? "border-ink bg-surface text-ink" : "border-line bg-surface text-muted hover:text-ink",
                )}
              >
                {label}
                <span className={cn("rounded-md px-1.5 py-0.5 text-xs tabular-nums", active ? "bg-ink text-surface" : "bg-bg text-muted")}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul atau ringkasan..."
            aria-label="Cari tulisan"
            className="pl-10"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-[15px] text-muted">
          {posts.length === 0 ? "Belum ada tulisan sama sekali." : "Nggak ada tulisan yang cocok."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((post) => (
            <PostCard key={post.id} post={post} onStatus={() => setModal({ kind: "status", post })} onDelete={() => setModal({ kind: "delete", post })} />
          ))}
        </ul>
      )}

      {modal?.kind === "status" ? <StatusModal key={modal.post.id} post={modal.post} onClose={close} /> : null}
      {modal?.kind === "delete" ? <DeleteModal key={modal.post.id} post={modal.post} onClose={close} /> : null}
    </div>
  );
}

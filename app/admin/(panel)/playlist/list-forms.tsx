"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ExternalIcon, PenIcon, SearchIcon, ShareIcon, TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ShareModal } from "@/components/admin/share-modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import { CHART_STYLES } from "@/lib/share/styles";
import { createPlaylist, setPlaylistStatus, type FormState } from "./actions";
import { PlaylistCover } from "@/components/site/playlist-view";
import { DeletePlaylistModal, ModalActions, PlaylistModal, roundIcon, type PlaylistInfo, type PostOption } from "./forms";
import { useRequired } from "@/components/ui/use-required";

export type PlaylistListItem = PlaylistInfo & { trackCount: number; artworks: string[]; updatedAt: string; storyTitle: string | null };

const pill = "inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface px-3.5 font-ui text-xs font-semibold text-ink hover:bg-bg";
const updatedDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
/** "10 Okt 2026": kapan playlist terakhir diubah, keterangan di kaki kartu. */
const updatedLabel = (iso: string) => updatedDate.format(new Date(iso));

/** Pop up playlist baru: nama dan keterangan. Setelah jadi, halaman berpindah ke pengelola playlist itu. */
function CreateModal({ onClose }: { onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(createPlaylist, undefined);
  const required = useRequired({ name: "Nama playlistnya diisi dulu." });
  return (
    <Modal open onClose={onClose} title="Playlist Baru" note="Mulai sebagai draf. Lagunya ditambahkan di halaman berikutnya.">
      <form action={action} onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-name">Nama Playlist</Label>
          <Input id="new-name" name="name" required autoFocus maxLength={80} placeholder="Misalnya: Buat nemenin hujan" {...required.field("name")} />
          {required.error("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-description">Keterangan Singkat</Label>
          <Textarea id="new-description" name="description" rows={3} maxLength={280} placeholder="Boleh dikosongin." />
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit="Buat" />
      </form>
    </Modal>
  );
}

type ModalState = { kind: "create" } | { kind: "edit"; playlist: PlaylistListItem } | { kind: "delete"; playlist: PlaylistListItem } | { kind: "share"; playlist: PlaylistListItem } | null;

/** Semua playlist (termasuk draf) sebagai kisi kartu bersampul seperti di beranda, dengan tindakan di kaki kartu. Chart diatur di menu sendiri. */
export function PlaylistList({ playlists, posts }: { playlists: PlaylistListItem[]; posts: PostOption[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  const close = () => setModal(null);
  // cari di nama, keterangan, dan judul tulisan terkait; status juga bisa dicari dengan kata "draf" atau "terbit"
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? playlists.filter((playlist) =>
        [playlist.name, playlist.description, playlist.storyTitle ?? "", playlist.status === "published" ? "terbit" : "draf"].some((text) => text.toLowerCase().includes(needle)),
      )
    : playlists;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Playlist"
        note="Playlist untuk suasana tertentu, tidak berganti tiap minggu. Klik namanya untuk mengatur isinya. Chart minggu ini punya menu sendiri."
        action={<Button block="sm" onClick={() => setModal({ kind: "create" })}>Playlist Baru</Button>}
      />

      <div className="relative w-full">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari playlist..." aria-label="Cari playlist" className="pl-10" />
      </div>

      {/* kisi kartu seperti di beranda: mosaik sampul jadi latar dengan bayangan gelap, nama dan jumlah lagu di bawahnya; tindakan di kaki kartu */}
      {shown.length === 0 ? (
        <p className="py-6 text-[15px] text-muted">{playlists.length === 0 ? "Belum ada playlist. Buat lewat tombol di atas." : "Nggak ada playlist yang cocok."}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((playlist) => {
            const published = playlist.status === "published";
            return (
              <li key={playlist.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <Link href={`/admin/playlist/${playlist.id}`} aria-label={`Atur isi ${playlist.name}`} className="group relative flex aspect-square flex-col justify-end overflow-hidden bg-(--cover) text-white">
                  <PlaylistCover artworks={playlist.artworks} className="absolute inset-0 w-full transition-transform duration-500 group-hover:scale-[1.03]" rounded="rounded-none" sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw" />
                  <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.9)_0%,rgba(17,17,17,0.5)_45%,rgba(17,17,17,0.05)_75%)]" />
                  <span className="absolute left-4 top-4 flex items-center gap-1.5">
                    <span className={cn("inline-flex h-6 items-center rounded-full px-2 font-ui text-[11px] font-semibold uppercase tracking-[0.06em]", published ? "bg-white/90 text-[#111111]" : "border border-white/70 text-white")}>
                      {published ? "Terbit" : "Draf"}
                    </span>
                    {playlist.storyTitle ? <span className="inline-flex h-6 items-center rounded-full bg-white/90 px-2 font-ui text-[11px] font-semibold uppercase tracking-[0.06em] text-[#111111]">Ada ceritanya</span> : null}
                  </span>
                  <span className="relative flex min-w-0 flex-col gap-1 p-5">
                    <span className="font-ui text-[13px] font-medium text-[#cfcfcf]">{playlist.trackCount} lagu</span>
                    <span className="line-clamp-2 font-display text-[1.625rem] font-medium leading-[1.2]">{playlist.name}</span>
                    {playlist.description ? <span className="line-clamp-2 text-[15px] leading-snug text-[#dcdcdc]">{playlist.description}</span> : null}
                  </span>
                </Link>
                <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                  <span className="min-w-0 truncate font-ui text-[12px] text-muted">
                    {playlist.storyTitle ? `Terkait "${playlist.storyTitle}"` : `Diubah ${updatedLabel(playlist.updatedAt)}`}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!published ? (
                      <form action={setPlaylistStatus}>
                        <input type="hidden" name="id" value={playlist.id} />
                        <input type="hidden" name="status" value="published" />
                        <button type="submit" className={pill}>
                          Terbitkan
                        </button>
                      </form>
                    ) : null}
                    {published ? (
                      <button type="button" onClick={() => setModal({ kind: "share", playlist })} aria-label={`Bagikan ${playlist.name}`} title="Kartu bagikan" className={roundIcon}>
                        <ShareIcon className="size-4" />
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setModal({ kind: "edit", playlist })} aria-label={`Ubah ${playlist.name}`} title="Ubah" className={roundIcon}>
                      <PenIcon className="size-4" />
                    </button>
                    {published ? (
                      <Link href={`/playlist/${playlist.slug}`} target="_blank" rel="noreferrer" aria-label={`Buka ${playlist.name} di situs`} title="Buka di situs" className={roundIcon}>
                        <ExternalIcon className="size-4" />
                      </Link>
                    ) : null}
                    <button type="button" onClick={() => setModal({ kind: "delete", playlist })} aria-label={`Hapus ${playlist.name}`} title="Hapus" className={cn(roundIcon, "hover:text-danger")}>
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.kind === "create" ? <CreateModal onClose={close} /> : null}
      {modal?.kind === "edit" ? <PlaylistModal key={modal.playlist.id} playlist={modal.playlist} posts={posts} onClose={close} /> : null}
      {modal?.kind === "delete" ? <DeletePlaylistModal key={modal.playlist.id} playlist={modal.playlist} onClose={close} /> : null}
      {modal?.kind === "share" ? (
        <ShareModal
          key={modal.playlist.id}
          title="Bagikan Playlist"
          note="Dua gaya, koran atau tiket, sepuluh lagu per halaman. Unduh satu per satu atau semuanya sekaligus, lalu unggah berurutan."
          src={`/api/playlist/${modal.playlist.id}`}
          zipSrc={`/api/playlist/${modal.playlist.id}/zip`}
          styles={CHART_STYLES}
          pages={Math.max(1, Math.ceil(modal.playlist.trackCount / 10))}
          version={modal.playlist.updatedAt}
          fileName={`playlist-${modal.playlist.slug}`}
          alt={`Kartu playlist ${modal.playlist.name}`}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

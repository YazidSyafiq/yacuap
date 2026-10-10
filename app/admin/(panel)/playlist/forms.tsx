"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AddTrackModal } from "@/components/admin/add-track-modal";
import { BackIcon, ExternalIcon, PenIcon, PlusIcon, ShareIcon } from "@/components/admin/icons";
import { iconOnDark } from "@/components/admin/styles";
import { TrackEditor } from "@/components/admin/track-editor";
import { Modal } from "@/components/admin/modal";
import { ShareModal } from "@/components/admin/share-modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import type { TrackOption } from "@/lib/admin/tracks";
import { fileSlug } from "@/lib/file-slug";
import { CHART_STYLES } from "@/lib/share/styles";
import { cn } from "@/lib/cn";
import { addTrack, deletePlaylist, removeTrack, savePlaylist, setPlaylistStatus, updatePlaylist, updateTrack, type FormState } from "./actions";
import { useRequired } from "@/components/ui/use-required";

export type Track = { id: string; title: string; artist: string; youtubeId: string; artwork: string | null; note: string };
export type PlaylistInfo = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  postId: string | null;
};
/** Tulisan terbit yang bisa dikaitkan sebagai "cerita di balik playlist ini". */
export type PostOption = { id: string; title: string };

/** Tombol ikon bulat bergaris seperti di mockup admin. */
export const roundIcon =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface";
export const tableHead = "font-ui text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

/** Tombol Batal dan tombol kirim di kaki pop up. */
export function ModalActions({ onClose, submit, danger = false }: { onClose: () => void; submit: string; danger?: boolean }) {
  return (
    <div className="grid gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
      <Button variant="secondary" size="sm" block onClick={onClose}>
        Batal
      </Button>
      <SubmitButton size="sm" block variant={danger ? "danger" : "primary"}>
        {submit}
      </SubmitButton>
    </div>
  );
}

/** Pop up ubah lagu: judul dan artis. Urutan dan catatan diatur langsung di editor. */
function EditTrackModal({ track, onClose }: { track: Track; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updateTrack(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);
  const required = useRequired({ title: "Judulnya diisi dulu." });

  return (
    <Modal open onClose={onClose} title="Ubah Lagu" note="Judul dan artis berlaku di semua playlist dan chart yang memuat lagu ini.">
      <form action={action} onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="trackId" value={track.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul</Label>
          <Input id="title" name="title" required autoFocus defaultValue={track.title} {...required.field("title")} />
          {required.error("title")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="artist">Artis</Label>
          <Input id="artist" name="artist" defaultValue={track.artist} />
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit="Simpan" />
      </form>
    </Modal>
  );
}

/** Pop up konfirmasi mengeluarkan lagu dari playlist. */
function RemoveTrackModal({ playlistId, track, onClose }: { playlistId: string; track: Track; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Keluarkan Lagu?" note="Lagunya dikeluarkan dari playlist ini saja. Bisa ditambahkan lagi kapan saja." danger>
      <form action={removeTrack} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="playlistId" value={playlistId} />
        <input type="hidden" name="trackId" value={track.id} />
        <TrackSummary track={track} />
        <ModalActions onClose={onClose} submit="Keluarkan" danger />
      </form>
    </Modal>
  );
}

/** Pop up nama, keterangan, dan tulisan terkait. */
export function PlaylistModal({ playlist, posts, onClose }: { playlist: PlaylistInfo; posts: PostOption[]; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updatePlaylist(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);
  const required = useRequired({ name: "Nama playlistnya diisi dulu." });

  return (
    <Modal open onClose={onClose} title="Ubah Playlist" note="Nama dan keterangannya tampil di beranda dan halaman /playlist.">
      <form action={action} onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="id" value={playlist.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama Playlist</Label>
          <Input id="name" name="name" required autoFocus maxLength={80} defaultValue={playlist.name} {...required.field("name")} />
          {required.error("name")}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Keterangan Singkat</Label>
          <Textarea id="description" name="description" rows={3} maxLength={280} defaultValue={playlist.description} placeholder="Boleh dikosongin." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="postId">Cerita di Balik Playlist Ini</Label>
          <Select id="postId" name="postId" defaultValue={playlist.postId ?? ""}>
            <option value="">Tidak ada</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </Select>
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit="Simpan" />
      </form>
    </Modal>
  );
}

/** Pop up konfirmasi menghapus playlist. `back="list"` berarti sesudahnya kembali ke daftar playlist. */
export function DeletePlaylistModal({ playlist, back, onClose }: { playlist: PlaylistInfo; back?: "list"; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Hapus Playlist?" note="Playlist dan susunannya hilang. Lagu-lagunya sendiri tetap tersimpan dan bisa dipakai playlist lain atau chart." danger>
      <form action={deletePlaylist} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={playlist.id} />
        {back ? <input type="hidden" name="back" value={back} /> : null}
        <p className="rounded-xl border border-line bg-bg px-4 py-3 text-[15px] font-semibold">{playlist.name}</p>
        <ModalActions onClose={onClose} submit="Hapus" danger />
      </form>
    </Modal>
  );
}

export function Artwork({ track, size }: { track: { artwork: string | null }; size: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-lg bg-(--cover)" style={{ width: size, height: size }}>
      {track.artwork ? <Image src={track.artwork} alt="" fill sizes={`${size}px`} unoptimized className="mono-img object-cover" /> : null}
    </span>
  );
}

/** Sampul, judul, dan artis satu lagu, untuk isi pop up. */
export function TrackSummary({ track }: { track: Track }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
      <Artwork track={track} size={48} />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold">{track.title}</p>
        {track.artist ? <p className="truncate text-sm text-muted">{track.artist}</p> : null}
      </div>
    </div>
  );
}

/** Sampul playlist dari empat sampul lagu pertama, sama seperti di situs. */
export function Mosaic({ artworks, className }: { artworks: string[]; className?: string }) {
  const tiles = artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1);
  return (
    <div aria-hidden="true" className={cn("grid aspect-square overflow-hidden rounded-xl bg-(--cover)", tiles.length === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1", className)}>
      {tiles.map((src) => (
        <span key={src} className="relative">
          <Image src={src} alt="" fill sizes="150px" unoptimized className="mono-img object-cover" />
        </span>
      ))}
    </div>
  );
}

/** Tombol kirim putih di atas kartu gelap, ukurannya sama dengan tombol `md` (236 x 44, selebar kartu di HP). */
function DarkSubmit({ disabled, title, children }: { disabled?: boolean; title?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      title={title}
      className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-white px-4 font-ui text-sm font-semibold text-[#111111] transition-colors hover:bg-[#e6e6e6] disabled:cursor-not-allowed disabled:opacity-50 sm:w-[236px]"
    >
      {pending ? "Sebentar" : children}
    </button>
  );
}

type ModalState = { kind: "add" } | { kind: "edit"; track: Track } | { kind: "remove"; track: Track } | { kind: "share" } | { kind: "share-track"; track: Track; position: number } | { kind: "playlist" } | { kind: "delete" } | null;

/**
 * Halaman satu playlist di admin, susunannya sama dengan halaman chart: kartu ringkasan gelap (mosaik sampul jadi latar,
 * status, nama, keterangan, lima sampul pertama, tombol terbit) dengan ikon tindakan di pojoknya, lalu editor lagu yang
 * urutan dan catatannya disimpan sekaligus. Lagu bisa diambil dari yang sudah ada (termasuk dari chart) atau tautan YouTube.
 */
export function PlaylistManager({ playlist, tracks, posts, options }: { playlist: PlaylistInfo; tracks: Track[]; posts: PostOption[]; options: TrackOption[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [dirty, setDirty] = useState(false);
  const close = () => setModal(null);
  const artworks = tracks.flatMap((track) => (track.artwork ? [track.artwork] : []));
  const version = `${tracks.length}:${tracks.map((track) => track.id.slice(0, 4)).join("")}`;
  const published = playlist.status === "published";
  const lock = dirty ? "Simpan dulu perubahanmu" : undefined;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-3xl bg-[#111111] text-white">
        <div aria-hidden="true" className={cn("absolute inset-0 grid", artworks.length >= 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1")}>
          {(artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1)).map((src) => (
            <span key={src} className="relative">
              <Image src={src} alt="" fill sizes="100vw" unoptimized className="mono-img object-cover" />
            </span>
          ))}
        </div>
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.92)_0%,rgba(17,17,17,0.72)_45%,rgba(17,17,17,0.35)_100%)]" />
        {/* tindakan sebagai ikon di pojok kanan atas: ubah, kartu bagikan, buka di situs, tambah lagu */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <Link href="/admin/playlist" aria-label="Semua playlist" title="Semua playlist" className={iconOnDark}>
            <BackIcon className="size-[18px]" />
          </Link>
          <button type="button" onClick={() => setModal({ kind: "playlist" })} aria-label="Ubah playlist" title="Ubah nama, keterangan, cerita" className={iconOnDark}>
            <PenIcon className="size-[18px]" />
          </button>
          {published ? (
            <>
              <button type="button" onClick={() => setModal({ kind: "share" })} disabled={tracks.length === 0 || dirty} aria-label="Kartu bagikan" title={lock ?? "Kartu bagikan"} className={iconOnDark}>
                <ShareIcon className="size-[18px]" />
              </button>
              <Link href={`/playlist/${playlist.slug}`} target="_blank" rel="noreferrer" aria-label="Buka di situs" title="Buka di situs" className={iconOnDark}>
                <ExternalIcon className="size-[18px]" />
              </Link>
            </>
          ) : null}
          <button type="button" onClick={() => setModal({ kind: "add" })} disabled={dirty} aria-label="Tambah lagu" title={lock ?? "Tambah lagu"} className={iconOnDark}>
            <PlusIcon className="size-[18px]" />
          </button>
        </div>
        <div className="relative flex flex-col gap-5 p-5 pt-16 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className={cn("inline-flex h-[26px] items-center whitespace-nowrap rounded-full border px-2.5 font-ui text-[12px] font-semibold uppercase tracking-[0.06em]", published ? "border-white text-white" : "border-white/50 text-[#cfcfcf]")}>
                {published ? "Terbit" : "Draf"}
              </span>
              <span className="font-ui text-[13px] font-medium text-[#cfcfcf]">{tracks.length} lagu</span>
              {!published ? <span className="font-ui text-[13px] font-medium text-[#cfcfcf]">belum tampil di situs</span> : null}
            </div>
            <span className="font-display text-[1.75rem] font-medium leading-tight sm:text-[2.25rem]">{playlist.name}</span>
            {playlist.description ? <span className="max-w-[560px] text-[15px] leading-relaxed text-[#cfcfcf] sm:text-[16px]">{playlist.description}</span> : null}
            <span className="mt-1 flex items-center gap-2">
              {tracks.slice(0, 5).map((track, i) => (
                <span key={track.id} className="relative size-10 overflow-hidden rounded-lg bg-(--cover)">
                  {track.artwork ? <Image src={track.artwork} alt="" fill sizes="40px" unoptimized className="mono-img object-cover" /> : null}
                  <span className="absolute bottom-0 left-0 rounded-tr-md bg-[#111111] px-1 font-ui text-[10px] font-semibold text-white">{i + 1}</span>
                </span>
              ))}
              {tracks.length === 0 ? <span className="font-ui text-[13px] text-[#cfcfcf]">Belum ada lagu.</span> : null}
            </span>
          </div>
          {/* terbitkan atau tarik jadi draf, dan hapus, sebagai tombol di kartu; keduanya terkunci selama ada perubahan belum disimpan */}
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <form action={setPlaylistStatus}>
              <input type="hidden" name="id" value={playlist.id} />
              <input type="hidden" name="status" value={published ? "draft" : "published"} />
              <DarkSubmit disabled={dirty} title={lock}>
                {published ? "Jadikan Draf" : "Terbitkan"}
              </DarkSubmit>
            </form>
            <button type="button" onClick={() => setModal({ kind: "delete" })} disabled={dirty} title={lock} className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-white/40 px-5 font-ui text-sm font-semibold text-white hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[236px]">
              Hapus Playlist
            </button>
          </div>
        </div>
      </section>

      <TrackEditor
        kind="playlist"
        tracks={tracks}
        action={savePlaylist}
        hidden={{ playlistId: playlist.id }}
        emptyText="Belum ada lagu. Tambah lewat ikon tambah di kartu, dari lagu yang sudah ada atau tautan YouTube."
        onAdd={() => setModal({ kind: "add" })}
        onRemove={(track) => setModal({ kind: "remove", track: track as Track })}
        onEdit={(track) => setModal({ kind: "edit", track: track as Track })}
        onShare={published ? (track, position) => setModal({ kind: "share-track", track: track as Track, position }) : undefined}
        onDirtyChange={setDirty}
      />

      {modal?.kind === "add" ? (
        <AddTrackModal options={options} exclude={new Set(tracks.map((track) => track.id))} hidden={{ playlistId: playlist.id }} action={addTrack} onClose={close} />
      ) : null}
      {modal?.kind === "edit" ? <EditTrackModal key={modal.track.id} track={modal.track} onClose={close} /> : null}
      {modal?.kind === "remove" ? <RemoveTrackModal key={modal.track.id} playlistId={playlist.id} track={modal.track} onClose={close} /> : null}
      {modal?.kind === "share" ? (
        <ShareModal
          title="Bagikan Playlist"
          note="Dua gaya, koran atau tiket, sepuluh lagu per halaman. Unduh satu per satu atau semuanya sekaligus, lalu unggah berurutan."
          src={`/api/playlist/${playlist.id}`}
          zipSrc={`/api/playlist/${playlist.id}/zip`}
          styles={CHART_STYLES}
          pages={Math.max(1, Math.ceil(tracks.length / 10))}
          version={version}
          fileName={`playlist-${playlist.slug}`}
          alt={`Kartu playlist ${playlist.name}`}
          onClose={close}
        />
      ) : null}
      {modal?.kind === "share-track" ? (
        <ShareModal
          key={modal.track.id}
          title="Bagikan Lagu"
          note={`${modal.track.title}, lagu ke-${modal.position} di ${playlist.name}. Satu gambar, gaya koran atau tiket.`}
          src={`/api/playlist/${playlist.id}/lagu/${modal.track.id}`}
          styles={CHART_STYLES}
          version={version}
          fileName={`playlist-${playlist.slug}-${String(modal.position).padStart(2, "0")}-${fileSlug(modal.track.title)}`}
          alt={`Kartu lagu ${modal.track.title}`}
          onClose={close}
        />
      ) : null}
      {modal?.kind === "playlist" ? <PlaylistModal playlist={playlist} posts={posts} onClose={close} /> : null}
      {modal?.kind === "delete" ? <DeletePlaylistModal playlist={playlist} back="list" onClose={close} /> : null}
    </div>
  );
}

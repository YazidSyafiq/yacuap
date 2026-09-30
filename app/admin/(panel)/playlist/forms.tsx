"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { NoteIcon, PenIcon, TrashIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/cn";
import { addTrack, moveTrackDown, moveTrackUp, removeTrack, updatePlaylist, updateTrack, type FormState } from "./actions";

export type Track = { id: string; title: string; artist: string; youtubeId: string; artwork: string | null; note: string };
export type PlaylistInfo = { id: string; name: string; description: string };

function ArrowIcon({ up, className }: { up?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {up ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
    </svg>
  );
}

const iconButton = "flex size-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

/** Tombol Batal dan tombol kirim di kaki pop up. */
function ModalActions({ onClose, submit, danger = false }: { onClose: () => void; submit: string; danger?: boolean }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
      <Button variant="secondary" size="sm" onClick={onClose}>
        Batal
      </Button>
      <SubmitButton size="sm" variant={danger ? "danger" : "primary"}>
        {submit}
      </SubmitButton>
    </div>
  );
}

/** Pop up tambah lagu: tempel tautan YouTube dan catatan. Tertutup sendiri kalau berhasil. */
function AddTrackModal({ playlistId, onClose }: { playlistId: string; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await addTrack(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);

  return (
    <Modal open onClose={onClose} title="Tambah Lagu" note="Judul, artis, dan sampulnya diambil otomatis dari YouTube. Bisa dirapikan setelahnya.">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="playlistId" value={playlistId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">Tautan YouTube Lagunya</Label>
          <Input id="url" name="url" required autoFocus inputMode="url" placeholder="https://www.youtube.com/watch?v=..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">Kenapa Lagu Ini Masuk?</Label>
          <Textarea id="note" name="note" rows={2} maxLength={400} placeholder="Boleh dikosongin, bisa diisi belakangan." />
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit="Tambah" />
      </form>
    </Modal>
  );
}

/** Pop up ubah lagu: judul, artis, catatan. */
function EditTrackModal({ playlistId, track, onClose }: { playlistId: string; track: Track; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updateTrack(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);

  return (
    <Modal open onClose={onClose} title="Ubah Lagu" note="Perubahannya langsung tampil di situs.">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="playlistId" value={playlistId} />
        <input type="hidden" name="trackId" value={track.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul</Label>
          <Input id="title" name="title" required autoFocus defaultValue={track.title} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="artist">Artis</Label>
          <Input id="artist" name="artist" defaultValue={track.artist} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-note">Kenapa Lagu Ini Masuk?</Label>
          <Textarea id="edit-note" name="note" rows={3} maxLength={400} defaultValue={track.note} />
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
    <Modal open onClose={onClose} title="Keluarkan Lagu?" note="Lagunya dikeluarkan dari playlist. Bisa ditambahkan lagi kapan saja." danger>
      <form action={removeTrack} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="playlistId" value={playlistId} />
        <input type="hidden" name="trackId" value={track.id} />
        <div className="flex items-center gap-3 rounded-xl border border-line bg-bg p-3">
          <Artwork track={track} size={48} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{track.title}</p>
            {track.artist ? <p className="truncate text-sm text-muted">{track.artist}</p> : null}
          </div>
        </div>
        <ModalActions onClose={onClose} submit="Keluarkan" danger />
      </form>
    </Modal>
  );
}

/** Pop up nama dan keterangan playlist. */
function PlaylistModal({ playlist, onClose }: { playlist: PlaylistInfo; onClose: () => void }) {
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await updatePlaylist(prev, formData);
    if (result?.ok) onClose();
    return result;
  }, undefined);

  return (
    <Modal open onClose={onClose} title="Ubah Playlist" note="Nama dan keterangannya tampil di beranda dan halaman /playlist.">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={playlist.id} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama Playlist</Label>
          <Input id="name" name="name" required autoFocus maxLength={80} defaultValue={playlist.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Keterangan Singkat</Label>
          <Textarea id="description" name="description" rows={3} maxLength={280} defaultValue={playlist.description} placeholder="Boleh dikosongin." />
        </div>
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <ModalActions onClose={onClose} submit="Simpan" />
      </form>
    </Modal>
  );
}

function Artwork({ track, size }: { track: Track; size: number }) {
  return (
    <span className="relative shrink-0 overflow-hidden rounded-lg bg-(--cover)" style={{ width: size, height: size }}>
      {track.artwork ? <Image src={track.artwork} alt="" fill sizes={`${size}px`} unoptimized className="mono-img object-cover" /> : null}
    </span>
  );
}

/** Satu baris lagu: nomor, sampul, judul dan artis, lalu tombol catatan (kalau ada), naik, turun, ubah, keluarkan. */
function TrackRow({
  playlistId,
  track,
  index,
  count,
  onEdit,
  onRemove,
  onNote,
}: {
  playlistId: string;
  track: Track;
  index: number;
  count: number;
  onEdit: () => void;
  onRemove: () => void;
  onNote: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line py-3 last:border-b-0 sm:flex-nowrap sm:gap-x-4">
      <span className="hidden w-6 shrink-0 text-right font-display text-sm tabular-nums text-muted sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Artwork track={track} size={48} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 self-center">
        <p className="truncate text-[15px] font-semibold leading-snug">{track.title}</p>
        <p className="truncate text-[13px] text-muted">{track.artist || "Artis belum diisi"}</p>
      </div>
      {/* di HP tombol-tombolnya turun ke baris sendiri, rata kanan, supaya judul tidak terjepit */}
      <div className="-mr-2 flex w-full shrink-0 items-center justify-end sm:w-auto">
        {/* catatan tidak langsung tampil: ada ikonnya kalau lagunya punya catatan, diklik baru muncul di pop up */}
        {track.note ? (
          <button type="button" onClick={onNote} aria-label="Lihat catatan" title="Lihat catatan" className={iconButton}>
            <NoteIcon className="size-4" />
          </button>
        ) : null}
        {/* naik dan turun langsung ke server, tanpa pop up */}
        <form action={moveTrackUp}>
          <input type="hidden" name="playlistId" value={playlistId} />
          <input type="hidden" name="trackId" value={track.id} />
          <button type="submit" disabled={index === 0} aria-label={`Naikkan ${track.title}`} title="Naikkan" className={iconButton}>
            <ArrowIcon up className="size-4" />
          </button>
        </form>
        <form action={moveTrackDown}>
          <input type="hidden" name="playlistId" value={playlistId} />
          <input type="hidden" name="trackId" value={track.id} />
          <button type="submit" disabled={index === count - 1} aria-label={`Turunkan ${track.title}`} title="Turunkan" className={iconButton}>
            <ArrowIcon className="size-4" />
          </button>
        </form>
        <button type="button" onClick={onEdit} aria-label={`Ubah ${track.title}`} title="Ubah" className={iconButton}>
          <PenIcon className="size-4" />
        </button>
        <button type="button" onClick={onRemove} aria-label={`Keluarkan ${track.title}`} title="Keluarkan" className={cn(iconButton, "hover:text-danger")}>
          <TrashIcon className="size-4" />
        </button>
      </div>
    </li>
  );
}

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; track: Track }
  | { kind: "remove"; track: Track }
  | { kind: "note"; track: Track }
  | { kind: "playlist" }
  | null;

/** Pop up catatan sebuah lagu: sampul dan judul, lalu catatannya utuh. Dari sini bisa langsung ke pop up ubah. */
function NoteModal({ track, onClose, onEdit }: { track: Track; onClose: () => void; onEdit: () => void }) {
  return (
    <Modal open onClose={onClose} title="Kenapa Lagu Ini Masuk?">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Artwork track={track} size={48} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{track.title}</p>
            {track.artist ? <p className="truncate text-sm text-muted">{track.artist}</p> : null}
          </div>
        </div>
        <blockquote className="rounded-xl border border-line bg-bg px-4 py-3 font-body text-[17px] italic leading-snug text-ink-soft">
          {track.note}
        </blockquote>
        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button size="sm" onClick={onEdit}>
            Ubah Catatan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Sampul playlist dari empat sampul lagu pertama, sama seperti di situs. */
function Mosaic({ tracks }: { tracks: Track[] }) {
  const artworks = tracks.flatMap((track) => (track.artwork ? [track.artwork] : []));
  const tiles = artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1);
  return (
    <div
      aria-hidden="true"
      className={cn("grid aspect-square overflow-hidden rounded-xl bg-(--cover)", tiles.length === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1")}
    >
      {tiles.map((src) => (
        <span key={src} className="relative">
          <Image src={src} alt="" fill sizes="150px" unoptimized className="mono-img object-cover" />
        </span>
      ))}
    </div>
  );
}

/**
 * Seluruh halaman Playlist, susunannya seperti halaman /playlist di situs:
 * ringkasan playlist di kiri (sampul mosaik, nama, keterangan, tombol ubah), daftar lagu di kanan, pop up untuk semuanya.
 */
export function PlaylistManager({ playlist, tracks }: { playlist: PlaylistInfo; tracks: Track[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Playlist"
        note="Satu playlist, isinya diatur dari sini. Urutan di daftar adalah urutan di situs."
        action={<Button onClick={() => setModal({ kind: "add" })}>Tambah Lagu</Button>}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[4.5rem]">
          <Mosaic tracks={tracks} />
          <div className="flex flex-col gap-1">
            <p className="text-[13px] text-muted">Isinya {tracks.length} lagu</p>
            <h2 className="font-display text-2xl font-medium leading-tight">{playlist.name}</h2>
          </div>
          {playlist.description ? <p className="text-sm leading-relaxed text-muted">{playlist.description}</p> : null}
          <Button variant="secondary" size="sm" onClick={() => setModal({ kind: "playlist" })}>
            Ubah Playlist
          </Button>
        </section>

        <section className="min-w-0 rounded-2xl border border-line bg-surface px-4 py-2 sm:px-5 sm:py-3">
          {tracks.length === 0 ? (
            <p className="py-6 text-sm text-muted">Belum ada lagu. Tambah lewat tombol di atas.</p>
          ) : (
            <ol className="flex flex-col">
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  playlistId={playlist.id}
                  track={track}
                  index={i}
                  count={tracks.length}
                  onEdit={() => setModal({ kind: "edit", track })}
                  onRemove={() => setModal({ kind: "remove", track })}
                  onNote={() => setModal({ kind: "note", track })}
                />
              ))}
            </ol>
          )}
        </section>
      </div>

      {modal?.kind === "add" ? <AddTrackModal playlistId={playlist.id} onClose={close} /> : null}
      {modal?.kind === "edit" ? <EditTrackModal key={modal.track.id} playlistId={playlist.id} track={modal.track} onClose={close} /> : null}
      {modal?.kind === "remove" ? <RemoveTrackModal key={modal.track.id} playlistId={playlist.id} track={modal.track} onClose={close} /> : null}
      {modal?.kind === "note" ? (
        <NoteModal key={modal.track.id} track={modal.track} onClose={close} onEdit={() => setModal({ kind: "edit", track: modal.track })} />
      ) : null}
      {modal?.kind === "playlist" ? <PlaylistModal playlist={playlist} onClose={close} /> : null}
    </div>
  );
}

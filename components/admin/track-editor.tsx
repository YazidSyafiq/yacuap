"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { NoteIcon, PenIcon, ShareIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { phoneAction } from "@/components/admin/styles";
import { LastWeekCell, MovementBadge, TrackNote } from "@/components/player/track-list";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { Artwork, roundIcon, tableHead } from "@/app/admin/(panel)/playlist/forms";

export type EditorTrack = { id: string; title: string; artist: string; artwork: string | null; note: string; lastPosition?: number | null; weeks?: number };
export type EditorState = { error?: string; ok?: string } | undefined;
type Row = { id: string; lastPosition: number | null; note: string };

const snapshot = (tracks: EditorTrack[]): Row[] => tracks.map((track) => ({ id: track.id, lastPosition: track.lastPosition ?? null, note: track.note }));
const same = (a: Row[], b: Row[]) => JSON.stringify(a) === JSON.stringify(b);

/** Pop up catatan lagu. Hasilnya masuk ke editor, belum ke server, sampai tombol Simpan di bilah bawah ditekan. */
function NoteEditModal({ title, note, onClose, onApply }: { title: string; note: string; onClose: () => void; onApply: (note: string) => void }) {
  const [draft, setDraft] = useState(note);
  return (
    <Modal open onClose={onClose} title="Kenapa Lagu Ini Masuk?" note={`Catatan untuk ${title}. Tampil di bawah judul lagu di situs, boleh dikosongin.`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft.trim());
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catatan-lagu">Catatan</Label>
          <Textarea id="catatan-lagu" rows={4} maxLength={400} autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Misalnya, hujan terus seminggu ini, ya mau nggak mau." />
          <p className="font-ui text-[12px] text-muted">{draft.length} dari 400 huruf</p>
        </div>
        <div className="grid gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
          <Button variant="secondary" size="sm" block onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" size="sm" block>
            Pakai
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Tombol di bilah simpan: Batalkan dan Simpan, setengah lebar masing-masing di HP, ukuran tetap di laptop. */
function SaveActions({ onReset }: { onReset: () => void }) {
  const { pending } = useFormStatus();
  const base = "inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-full px-3 font-ui text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-40";
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
      <button type="button" onClick={onReset} disabled={pending} className={cn(base, "border border-bg/40 text-bg hover:bg-bg/10")}>
        Batalkan
      </button>
      <button type="submit" disabled={pending} aria-busy={pending} className={cn(base, "bg-bg text-ink hover:bg-bg/90")}>
        {pending ? "Menyimpan" : "Simpan"}
      </button>
    </div>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="9" cy="6" r="1.6" />
      <circle cx="15" cy="6" r="1.6" />
      <circle cx="9" cy="12" r="1.6" />
      <circle cx="15" cy="12" r="1.6" />
      <circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="18" r="1.6" />
    </svg>
  );
}

function RemoveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Editor isi chart atau playlist di browser: urutan diubah dengan menyeret pegangan atau panah, catatan lewat pop up.
 * Semua perubahan ditahan dulu, lalu dikirim sekaligus lewat tombol Simpan (bilah di bawah tabel muncul begitu ada yang
 * berubah) sebagai `payload` JSON ke `action`. Tambah, ubah, bagikan, dan keluarkan lagu lewat pop up di luar editor.
 * Chart punya kolom minggu lalu, lencana gerak, batas `max` lagu, dan tombol bagikan per lagu; playlist punya tombol ubah.
 */
export function TrackEditor({
  kind,
  tracks,
  max,
  action,
  hidden = {},
  emptyText,
  onAdd,
  onRemove,
  onShare,
  onEdit,
  onDirtyChange,
}: {
  kind: "chart" | "playlist";
  tracks: EditorTrack[];
  /** Batas jumlah lagu; kalau diisi, slot kosongnya ditampilkan. */
  max?: number;
  action: (prev: EditorState, formData: FormData) => Promise<EditorState>;
  /** Isian tersembunyi yang ikut dikirim bersama payload, misalnya id playlist. */
  hidden?: Record<string, string>;
  emptyText: string;
  onAdd: () => void;
  onRemove: (track: EditorTrack) => void;
  /** Kartu bagikan satu lagu; dikunci selama ada perubahan belum disimpan karena posisinya bisa berubah. Untuk playlist hanya kalau sudah terbit. */
  onShare?: (track: EditorTrack, position: number) => void;
  /** Ubah judul dan artis (playlist). */
  onEdit?: (track: EditorTrack) => void;
  /** Dipanggil saat ada atau tidak ada perubahan yang belum disimpan, supaya tombol lain di halaman bisa dikunci. */
  onDirtyChange: (dirty: boolean) => void;
}) {
  const chart = kind === "chart";
  const byId = new Map(tracks.map((track) => [track.id, track]));
  const [saved, setSaved] = useState<Row[]>(() => snapshot(tracks));
  const [rows, setRows] = useState<Row[]>(() => snapshot(tracks));
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const dirty = !same(rows, saved);
  const dirtyCount = rows.reduce((count, row, i) => {
    const before = saved.find((item) => item.id === row.id);
    const moved = saved.findIndex((item) => item.id === row.id) !== i;
    return count + (moved || !before || before.lastPosition !== row.lastPosition || before.note !== row.note ? 1 : 0);
  }, 0);

  // data dari server berubah (setelah tambah, keluarkan, ubah, atau simpan): editor mengikuti
  const incoming = JSON.stringify(snapshot(tracks));
  const seen = useRef(incoming);
  useEffect(() => {
    if (seen.current === incoming) return;
    seen.current = incoming;
    const next = snapshot(tracks);
    setSaved(next);
    setRows(next);
  }, [incoming, tracks]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const [state, submit] = useActionState<EditorState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok) setSaved(rows);
    return result;
  }, undefined);

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return;
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  };
  const patch = (id: string, change: Partial<Row>) => setRows((current) => current.map((row) => (row.id === id ? { ...row, ...change } : row)));

  // kolom tindakan: tiga ikon untuk chart, empat untuk playlist yang bisa dibagikan (ubah, bagikan, catatan, keluarkan)
  const actionCount = chart || !onShare ? 3 : 4;
  const columns = chart
    ? "sm:[grid-template-columns:28px_72px_64px_minmax(0,1fr)_144px_158px] sm:gap-x-6"
    : actionCount === 4
      ? "sm:[grid-template-columns:28px_72px_64px_minmax(0,1fr)_204px] sm:gap-x-6"
      : "sm:[grid-template-columns:28px_72px_64px_minmax(0,1fr)_158px] sm:gap-x-6";
  const empty = max ? Math.max(max - rows.length, 0) : 1;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className={cn("hidden items-center gap-3 border-b border-line px-4 py-3 sm:grid", columns)}>
          <span />
          <span className={tableHead}>{chart ? "Posisi" : "Urutan"}</span>
          <span />
          <span className={tableHead}>Lagu</span>
          {chart ? <span className={cn(tableHead, "text-center sm:pl-2")}>Minggu lalu</span> : null}
          <span className={cn(tableHead, "text-right")}>Tindakan</span>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">{emptyText}</p>
        ) : (
          <ol className="flex flex-col">
            {rows.map((row, i) => {
              const track = byId.get(row.id);
              if (!track) return null;
              const position = i + 1;
              const weeks = track.weeks ?? 0;
              const weeksText = !chart || row.lastPosition == null || weeks <= 1 ? "" : `, bertahan ${weeks} minggu`;
              const arrow = (dir: "up" | "down") => (
                <button
                  type="button"
                  onClick={() => move(i, dir === "up" ? i - 1 : i + 1)}
                  disabled={dir === "up" ? i === 0 : i === rows.length - 1}
                  aria-label={dir === "up" ? "Naik satu" : "Turun satu"}
                  className="flex size-6 items-center justify-center rounded text-muted hover:bg-bg hover:text-ink disabled:opacity-30 sm:size-5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3">
                    <path d={dir === "up" ? "M5 15l7-7 7 7" : "M5 9l7 7 7-7"} />
                  </svg>
                </button>
              );
              const positionCell = (
                <div className="flex items-center gap-2 sm:h-16 sm:gap-2.5">
                  <span aria-label={`${chart ? "Posisi" : "Urutan"} ${position}`} className="w-9 text-center font-display text-[2rem] font-semibold tabular-nums leading-none tracking-[-0.02em] sm:text-[1.75rem] sm:font-medium sm:tracking-normal">
                    {position}
                  </span>
                  <div className="flex flex-col">
                    {arrow("up")}
                    {arrow("down")}
                  </div>
                </div>
              );
              // tombol di depan catatan dan keluarkan: playlist punya ubah judul dan artis; bagikan ada kalau kartunya tersedia
              const share = { label: "Bagikan", title: dirty ? "Simpan dulu perubahanmu" : "Kartu bagikan lagu ini", icon: <ShareIcon className="size-4" />, disabled: dirty, onClick: () => onShare?.(track, position) };
              const edit = { label: "Ubah", title: "Ubah judul dan artis", icon: <PenIcon className="size-4" />, disabled: false, onClick: () => onEdit?.(track) };
              const leading = chart ? [share] : onShare ? [edit, share] : [edit];
              return (
                <li
                  key={row.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (over !== i) setOver(i);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragging != null) move(dragging, i);
                    setDragging(null);
                    setOver(null);
                  }}
                  className={cn("border-b border-line last:border-b-0", over === i && dragging != null && dragging !== i && "bg-bg", dragging === i && "opacity-40")}
                >
                  {/* HP: kartu per lagu seperti daftar di situs. Posisi dan panah, sampul, judul utuh; catatan bergaya kutipan; keterangan; tiga tombol tindakan selebar kartu */}
                  <div className="flex flex-col gap-3.5 px-4 py-5 sm:hidden">
                    <div className="flex items-center gap-3">
                      {positionCell}
                      <Artwork track={track} size={56} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="font-ui text-[16px] font-semibold leading-[1.3]">{track.title}</p>
                        <p className="font-ui text-[13px] text-muted">{track.artist || "Artis belum diisi"}</p>
                      </div>
                    </div>
                    {row.note ? <TrackNote note={row.note} quote /> : null}
                    {chart ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <MovementBadge position={position} lastPosition={row.lastPosition} />
                        <span className="font-ui text-xs font-medium text-muted">
                          {row.lastPosition == null ? "baru masuk minggu ini" : `minggu lalu di ${row.lastPosition}, ${weeks <= 1 ? "baru masuk" : `bertahan ${weeks} minggu`}`}
                        </span>
                      </div>
                    ) : null}
                    <div className={cn("grid gap-2", actionCount === 4 ? "grid-cols-2" : "grid-cols-3")}>
                      {leading.map((item) => (
                        <button key={item.label} type="button" onClick={item.onClick} disabled={item.disabled} title={item.title} className={phoneAction}>
                          {item.icon}
                          {item.label}
                        </button>
                      ))}
                      <button type="button" onClick={() => setOpenNote(row.id)} className={cn(phoneAction, !row.note && "text-muted")}>
                        <NoteIcon className="size-4" />
                        Catatan
                      </button>
                      <button type="button" onClick={() => onRemove(track)} className={cn(phoneAction, "hover:text-danger")}>
                        <RemoveIcon className="size-4" />
                        Keluarkan
                      </button>
                    </div>
                  </div>

                  {/* laptop: baris tabel, sel-selnya rata atas dengan kotak setinggi sampul */}
                  <div className={cn("hidden items-start gap-3 px-4 py-4 sm:grid", columns)}>
                    <div className="flex h-16 items-center">
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.effectAllowed = "move";
                          setDragging(i);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        aria-label={`Seret ${track.title} untuk mengubah urutan`}
                        title="Seret untuk mengubah urutan"
                        className="flex size-7 cursor-grab items-center justify-center rounded-md text-muted hover:bg-bg hover:text-ink active:cursor-grabbing"
                      >
                        <GripIcon className="size-4" />
                      </button>
                    </div>
                    {positionCell}
                    <Artwork track={track} size={64} />
                    {/* ada catatan: judul dan artis rata atas sejajar sampul; tanpa catatan: di tengah tinggi sampul */}
                    <div className={cn("flex min-w-0 max-w-[560px] flex-col gap-0.5", row.note ? "pt-0.5" : "min-h-16 justify-center")}>
                      <p className="truncate font-ui text-[16px] font-semibold leading-snug">{track.title}</p>
                      <p className="truncate font-ui text-[13px] text-muted">
                        {track.artist || "Artis belum diisi"}
                        {weeksText}
                      </p>
                      {row.note ? <TrackNote note={row.note} compact muted /> : null}
                    </div>
                    {chart ? <LastWeekCell position={position} lastPosition={row.lastPosition} className="h-16 pl-2" /> : null}
                    <div className="flex h-16 shrink-0 items-center justify-end gap-1.5">
                      {leading.map((item) => (
                        <button key={item.label} type="button" onClick={item.onClick} disabled={item.disabled} aria-label={`${item.label} ${track.title}`} title={item.title} className={roundIcon}>
                          {item.icon}
                        </button>
                      ))}
                      <button type="button" onClick={() => setOpenNote(row.id)} aria-label={row.note ? "Ubah catatan" : "Tulis catatan"} title={row.note ? "Ubah catatan" : "Tulis catatan"} className={cn(roundIcon, !row.note && "text-muted")}>
                        <NoteIcon className="size-4" />
                      </button>
                      <button type="button" onClick={() => onRemove(track)} aria-label={`Keluarkan ${track.title}`} title="Keluarkan" className={cn(roundIcon, "hover:text-danger")}>
                        <RemoveIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {empty > 0 ? (
          <button type="button" onClick={onAdd} disabled={dirty} title={dirty ? "Simpan dulu perubahanmu" : undefined} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong font-ui text-[12px] font-semibold text-muted">{rows.length + 1}</span>
            <span className="font-ui text-sm text-muted">
              {max ? `${empty} slot kosong, posisi ${rows.length + 1}${empty > 1 ? ` sampai ${max}` : ""}. Tekan untuk menambah lagu.` : "Tekan untuk menambah lagu, dari yang sudah ada atau tautan YouTube."}
            </span>
          </button>
        ) : null}
      </div>

      {openNote ? (
        <NoteEditModal
          key={openNote}
          title={byId.get(openNote)?.title ?? ""}
          note={rows.find((row) => row.id === openNote)?.note ?? ""}
          onClose={() => setOpenNote(null)}
          onApply={(note) => {
            patch(openNote, { note });
            setOpenNote(null);
          }}
        />
      ) : null}

      {/* bilah simpan: muncul begitu ada yang berubah, menempel di bawah layar, warnanya kebalikan tema seperti bar pemutar */}
      <form action={submit} className={cn("sticky bottom-4 z-20 flex flex-col gap-4 rounded-2xl bg-ink p-4 text-bg shadow-[0_12px_40px_rgba(17,17,17,0.25)] sm:flex-row sm:items-center sm:justify-between sm:px-5", dirty ? "" : "hidden")}>
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input type="hidden" name="payload" value={JSON.stringify(rows)} />
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-bg/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-bg" />
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="font-ui text-[15px] font-semibold leading-snug">{dirtyCount} perubahan belum disimpan</p>
            <p className="text-sm leading-snug text-bg/70">{state?.error ? <span className="text-[#ff8a80]">{state.error}</span> : "Urutan dan catatan dikirim sekaligus."}</p>
          </div>
        </div>
        <SaveActions onReset={() => setRows(saved)} />
      </form>
    </section>
  );
}

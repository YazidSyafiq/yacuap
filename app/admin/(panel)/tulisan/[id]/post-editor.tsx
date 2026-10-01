"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type TextareaHTMLAttributes } from "react";
import { BackIcon, EyeIcon, ImageIcon, LinkIcon, MusicIcon, SearchIcon } from "@/components/admin/icons";
import { Modal } from "@/components/admin/modal";
import { TrackCard, type TrackCardAttrs } from "@/components/editor/track-card";
import { AuthorPhoto } from "@/components/site/author-photo";
import { StoryBody } from "@/components/site/story-body";
import { Button } from "@/components/ui/button";
import { TagChip } from "@/components/ui/chip";
import { Input, Label } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { createTrackFromUrl, removeCover, savePost, uploadCover, uploadInlineImage, type TrackResult } from "../actions";

export type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: unknown;
  cover: string | null;
  published: boolean;
  tagIds: string[];
};

export type EditorTag = { id: string; name: string; position: number };
export type EditorTrack = TrackCardAttrs;

/** Penanda bahwa yang memicu pop up keluar adalah tombol mundur, bukan tautan. */
const BACK = "__mundur__";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

/** Perkiraan waktu baca, cara hitungnya sama dengan di server: 200 kata per menit. */
function readingTime(html: string) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Kotak teks tanpa bingkai yang tingginya selalu mengikuti isinya, jadi tidak pernah punya gulir sendiri.
 * Tingginya dihitung ulang tiap isinya berubah dan saat lebar layar berubah.
 */
function AutoTextarea({ className, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fit = () => {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={cn("no-focus-ring block w-full resize-none overflow-hidden bg-transparent placeholder:text-muted/60", className)}
      {...props}
    />
  );
}

/* ----------------------------------------------------------------------------
 * Toolbar editor
 * -------------------------------------------------------------------------- */

function ToolButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 font-ui text-sm font-semibold text-muted hover:bg-line hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent",
        active && "bg-ink text-surface hover:bg-ink hover:text-surface",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage, onTrack, uploading }: { editor: Editor; onImage: () => void; onTrack: () => void; uploading: boolean }) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Alamat tautannya:", previous ?? "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  // Toolbar membaca keadaan editornya sendiri, jadi hanya toolbar yang dirender ulang saat mengetik atau memindah kursor.
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      link: ctx.editor.isActive("link"),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      h3: ctx.editor.isActive("heading", { level: 3 }),
      bullet: ctx.editor.isActive("bulletList"),
      ordered: ctx.editor.isActive("orderedList"),
      quote: ctx.editor.isActive("blockquote"),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
  });

  const divider = <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />;

  return (
    <div className="sticky top-14 z-20 flex flex-wrap items-center gap-0.5 border-y border-line bg-bg/95 px-2 py-1.5 backdrop-blur-md sm:px-6">
      <ToolButton label="Tebal" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolButton>
      <ToolButton label="Miring" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="font-display italic">I</span>
      </ToolButton>
      <ToolButton label="Tautan" active={state.link} onClick={setLink}>
        <LinkIcon className="size-4" />
      </ToolButton>
      {divider}
      <ToolButton label="Judul bagian" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolButton>
      <ToolButton label="Sub judul" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolButton>
      <ToolButton label="Daftar" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <span className="text-base leading-none">•</span>
      </ToolButton>
      <ToolButton label="Daftar bernomor" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolButton>
      <ToolButton label="Kutipan" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <span className="font-display text-lg leading-none">&ldquo;</span>
      </ToolButton>
      <ToolButton label="Pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ···
      </ToolButton>
      {divider}
      <ToolButton label="Sisipkan gambar" disabled={uploading} onClick={onImage}>
        <ImageIcon className="size-4" />
      </ToolButton>
      <ToolButton label="Sisipkan lagu" onClick={onTrack}>
        <MusicIcon className="size-4" />
      </ToolButton>
      {divider}
      <ToolButton label="Urungkan" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolButton>
      <ToolButton label="Ulangi" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolButton>
    </div>
  );
}

/** Pop up pilih lagu untuk disisipkan: dari lagu yang sudah ada, atau tempel tautan YouTube baru. */
function TrackModal({ tracks, onPick, onClose }: { tracks: EditorTrack[]; onPick: (track: EditorTrack) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState<TrackResult | undefined, FormData>(async (prev, formData) => {
    const result = await createTrackFromUrl(prev, formData);
    if ("track" in result) onPick(result.track);
    return result;
  }, undefined);
  const needle = query.trim().toLowerCase();
  const shown = tracks.filter((track) => !needle || `${track.title} ${track.artist}`.toLowerCase().includes(needle));

  return (
    <Modal open onClose={onClose} title="Sisipkan Lagu" note="Pilih dari lagu yang sudah ada, atau tempel tautan YouTube.">
      <div className="flex flex-col gap-4">
        <form action={action} className="flex flex-col gap-2">
          <Label htmlFor="track-url">Tautan YouTube</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="track-url" name="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=..." className="flex-1" />
            <Button variant="secondary" size="sm" block="sm" type="submit" disabled={pending}>
              {pending ? "Mengambil..." : "Ambil Lagu"}
            </Button>
          </div>
          {state && "error" in state ? <FormError variant="field">{state.error}</FormError> : null}
        </form>
        {tracks.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari lagu yang sudah ada..." aria-label="Cari lagu" className="pl-10" />
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {shown.map((track) => (
                <li key={track.id}>
                  <button type="button" onClick={() => onPick(track)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-bg">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-(--cover)">
                      {track.artwork ? <NextImage src={track.artwork} alt="" fill sizes="40px" unoptimized className="mono-img object-cover" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{track.title}</span>
                      <span className="block truncate text-xs text-muted">{track.artist}</span>
                    </span>
                  </button>
                </li>
              ))}
              {shown.length === 0 ? <li className="px-2 py-3 text-sm text-muted">Nggak ada yang cocok.</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------------------------------
 * Editor
 * -------------------------------------------------------------------------- */

/**
 * Editor tulisan, susunannya diadaptasi dari editor artikel SINUS × PASSAGA:
 * kiri satu kartu berisi judul besar, ringkasan, toolbar, dan isi; kanan satu kartu berisi
 * cover, status, alamat, tag, lalu tombol terbit dan draf bertumpuk. Tombol Pratinjau menampilkan hasilnya seperti di situs.
 * Tidak ada simpan otomatis: tulisan, cover, tag, dan lainnya baru tersimpan saat tombol di kartu kanan ditekan.
 * Tulisan baru (id kosong) baru dibuat di database saat pertama kali disimpan.
 * Kalau mau meninggalkan halaman saat masih ada perubahan, muncul pop up konfirmasi simpan.
 */
export function PostEditor({ post, tags, tracks }: { post: EditorPost; tags: EditorTag[]; tracks: EditorTrack[] }) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.title) && slugify(post.title) !== post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const router = useRouter();
  // kosong selama tulisan baru belum pernah disimpan
  const [postId, setPostId] = useState(post.id);
  // alamat yang mau dituju saat masih ada perubahan; terisi berarti pop up konfirmasi sedang tampil
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [published, setPublished] = useState(post.published);
  const [tagIds, setTagIds] = useState<string[]>(post.tagIds);
  const [cover, setCover] = useState(post.cover);
  // cover baru yang dipilih tapi belum disimpan: pratinjaunya lokal, unggahnya saat tombol simpan ditekan
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [trackModal, setTrackModal] = useState(false);
  // pratinjau: isi editor diambil saat tombolnya ditekan
  const [preview, setPreview] = useState<{ html: string } | null>(null);
  // Tidak ada simpan otomatis: semua perubahan baru tersimpan saat tombol ditekan.
  // `dirty` hanya penanda ada perubahan yang belum disimpan (React tidak merender ulang kalau nilainya sama).
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();
  // true setelah pengguna memutuskan keluar, supaya penjaga tombol mundur tidak mencegat lagi
  const leavingRef = useRef(false);
  // jumlah entri riwayat penjaga yang sudah dipasang di halaman ini
  const guardCountRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    // toolbar membaca keadaannya sendiri lewat useEditorState, jadi mengetik tidak merender ulang seluruh formulir
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
        codeBlock: false,
        code: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TrackCard,
      Placeholder.configure({ placeholder: "Mulai nulis di sini. Tekan Enter buat paragraf baru." }),
    ],
    content: (post.content as object) ?? { type: "doc", content: [] },
    // font-body: kerangka admin memakai huruf UI, sedangkan isi tulisan harus tampil dengan huruf baca seperti di situs
    editorProps: { attributes: { class: "tulisan tiptap font-body min-h-[280px] px-1 py-2" } },
    onUpdate: () => setDirty(true),
  });

  const touch = () => setDirty(true);

  // Selama ada perubahan yang belum disimpan:
  // - menutup atau memuat ulang halaman memunculkan peringatan bawaan browser;
  // - mengklik tautan mana pun di halaman (Kembali, menu sidebar, dan lainnya) dicegat dulu dengan pop up konfirmasi;
  // - tombol mundur di HP atau browser juga dicegat dengan pop up yang sama.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const intercept = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.origin !== window.location.origin) return;
      if (anchor.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaveHref(anchor.pathname + anchor.search + anchor.hash);
    };
    // Tombol mundur (di HP maupun browser): halaman tidak bisa menahannya langsung, jadi dipasang satu entri riwayat
    // tambahan dengan alamat yang sama. Mundur pertama hanya "memakan" entri itu (halaman tidak berpindah),
    // lalu entri dipasang lagi dan pop up konfirmasi ditampilkan.
    window.history.pushState(null, "", window.location.href);
    guardCountRef.current += 1;
    const onBack = () => {
      if (leavingRef.current) return;
      window.history.pushState(null, "", window.location.href);
      setLeaveHref(BACK);
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("popstate", onBack);
    document.addEventListener("click", intercept, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("popstate", onBack);
      document.removeEventListener("click", intercept, true);
    };
  }, [dirty]);

  /** Meninggalkan halaman setelah dikonfirmasi: ke alamat yang diklik, atau mundur kalau asalnya tombol mundur. */
  const leave = (target: string) => {
    leavingRef.current = true;
    // mundur melewati semua entri penjaga (satu per sesi mengubah-lalu-menyimpan), lalu keluar dari editor
    if (target === BACK) window.history.go(-(guardCountRef.current + 1));
    else router.push(target);
  };

  /**
   * Menyimpan lewat tombol: tulisannya dulu (untuk tulisan baru, di sinilah barisnya dibuat), lalu cover kalau
   * diganti atau dilepas. `after` dijalankan kalau berhasil, misalnya untuk meninggalkan halaman.
   */
  const save = (publish: boolean, after?: () => void) => {
    const form = formRef.current;
    if (!form || !editor) return;
    const formData = new FormData(form);
    formData.set("id", postId);
    formData.set("status", publish ? "published" : "draft");
    formData.set("content_json", JSON.stringify(editor.getJSON()));
    formData.set("content_html", editor.getHTML());
    startSaving(async () => {
      const result = await savePost(undefined, formData);
      if (result?.error || !result?.id) {
        setError(result?.error ?? "Gagal menyimpan. Coba lagi.");
        return;
      }
      const id = result.id;
      if (coverFile) {
        const coverData = new FormData();
        coverData.set("id", id);
        coverData.set("file", coverFile);
        const uploaded = await uploadCover(coverData);
        if ("error" in uploaded) {
          // tulisannya sudah tersimpan; hanya covernya yang gagal
          setPostId(id);
          setError(`Tulisannya tersimpan, tapi covernya gagal: ${uploaded.error}`);
          return;
        }
        setCover(uploaded.url);
        setCoverFile(null);
      } else if (coverRemoved) {
        const coverData = new FormData();
        coverData.set("id", id);
        await removeCover(coverData);
        setCover(null);
        setCoverRemoved(false);
      }
      setError(null);
      setDirty(false);
      setPostId(id);
      if (result.savedAt) setSavedAt(result.savedAt);
      if (result.slug && result.slug !== slug) setSlug(result.slug);
      setPublished(publish);
      if (after) after();
      // tulisan baru: setelah tersimpan pertama kali, alamat editornya pindah ke alamat tulisannya
      else if (!post.id) router.replace(`/admin/tulisan/${id}`);
    });
  };

  /** Gambar di dalam isi harus diunggah saat dipilih, karena editor butuh alamatnya untuk menampilkannya. */
  const uploadInline = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadInlineImage(formData);
    setUploading(false);
    if ("error" in result) {
      setUploadError(result.error);
      return;
    }
    editor?.chain().focus().setImage({ src: result.url, alt: "" }).run();
  };

  // pratinjau cover: file yang baru dipilih (lokal), atau cover tersimpan, atau kosong kalau dilepas
  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);
  useEffect(() => {
    if (!coverPreview) return;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);
  const shownCover = coverPreview ?? (coverRemoved ? null : cover);

  const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));

  const statusText = saving
    ? "Menyimpan..."
    : dirty
      ? "Ada perubahan yang belum disimpan"
      : savedAt
        ? `Tersimpan ${timeFormat.format(new Date(savedAt))}`
        : "";

  const section = "flex flex-col gap-1.5";
  const label = "text-[13px] font-semibold text-ink-soft";

  return (
    <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={postId} />

      {/* baris atas: kembali di kiri, keadaan simpan dan tautan lihat di kanan */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/tulisan" className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <BackIcon className="size-4" />
          Kembali ke daftar
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-muted">{statusText}</span>
          <button
            type="button"
            onClick={() => setPreview({ html: editor?.getHTML() ?? "" })}
            className="flex items-center gap-1.5 font-semibold text-ink hover:underline"
          >
            Pratinjau
            <EyeIcon className="size-4" />
          </button>
          {published ? (
            <a href={`/tulisan/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold text-ink hover:underline">
              Lihat di situs
            </a>
          ) : null}
        </div>
      </div>

      {/* dua kolom sama tinggi: kartu kiri direntangkan mengikuti kartu kanan, dan sebaliknya */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* kiri: judul dan editor */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-col gap-2 px-4 pb-5 pt-5 sm:px-8 sm:pt-7">
              <AutoTextarea
                name="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slugTouched) setSlug(slugify(event.target.value));
                  touch();
                }}
                maxLength={200}
                placeholder="Judulnya apa?"
                aria-label="Judul"
                className="font-display text-[1.5rem] font-medium leading-[1.15] tracking-[-0.01em] sm:text-[1.875rem]"
              />
              <AutoTextarea
                name="excerpt"
                value={excerpt}
                onChange={(event) => {
                  setExcerpt(event.target.value);
                  touch();
                }}
                maxLength={300}
                placeholder="Ringkasan: satu dua kalimat pembuka. Tampil di daftar dan di bawah judul."
                aria-label="Ringkasan"
                className="font-body text-[17px] italic leading-snug text-muted"
              />
            </div>
            {editor ? <Toolbar editor={editor} uploading={uploading} onImage={() => imageInputRef.current?.click()} onTrack={() => setTrackModal(true)} /> : null}
            {/* area isi mengisi sisa tinggi kartu; diklik di mana pun, kursor masuk ke tulisan */}
            <div className="flex min-w-0 flex-1 cursor-text flex-col px-4 py-4 sm:px-8 sm:py-6" onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} className="flex flex-1 flex-col [&>div]:flex-1" />
            </div>
          </div>
          {uploadError ? <FormError>{uploadError}</FormError> : null}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadInline(file);
              event.target.value = "";
            }}
          />
        </div>

        {/* kanan: keterangan tulisan, dalam satu kartu */}
        <aside className="flex min-w-0 flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className={section}>
            <span className={label}>Cover</span>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-(--cover)">
              {shownCover ? <NextImage src={shownCover} alt="" fill sizes="340px" unoptimized className="mono-img object-cover" /> : null}
              {!shownCover ? <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">Belum ada cover</p> : null}
            </div>
            <span className="text-xs text-muted">Baru terunggah dan dijadikan hitam putih saat disimpan. Maksimal 10 MB, bagusnya 16:9.</span>
            <Button variant="secondary" size="sm" block onClick={() => coverInputRef.current?.click()}>
              {shownCover ? "Ganti Cover" : "Pilih Cover"}
            </Button>
            {shownCover ? (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setCoverRemoved(Boolean(cover));
                  if (coverInputRef.current) coverInputRef.current.value = "";
                  touch();
                }}
                className="w-fit self-center text-xs font-semibold text-danger hover:underline"
              >
                Lepas cover
              </button>
            ) : null}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  setCoverRemoved(false);
                  touch();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                published ? "bg-ink text-surface" : "border border-border-strong bg-surface text-ink",
              )}
            >
              {published ? "Terbit" : "Draf"}
            </span>
            <span className="text-xs text-muted">{published ? "Perubahan tersimpan langsung tampil di situs" : "Hanya terlihat di sini"}</span>
          </div>

          <div className={section}>
            <label htmlFor="slug" className={label}>
              Alamat
            </label>
            <div className="flex items-center gap-1 rounded-[10px] border border-border-strong bg-surface pl-3.5">
              <span className="shrink-0 font-ui text-sm text-muted">/tulisan/</span>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(slugify(event.target.value));
                  setSlugTouched(true);
                  touch();
                }}
                className="no-focus-ring h-10 border-0 px-0 font-mono text-xs"
              />
            </div>
            <span className="text-xs text-muted">Dibuat dari judul. Kalau sudah terbit, sebaiknya jangan diganti.</span>
          </div>

          <div className={section}>
            <span className={label}>Tag</span>
            {tags.length === 0 ? (
              <span className="text-xs text-muted">Belum ada tag. Bikin dulu di menu Tag.</span>
            ) : (
              <>
                {/* pilihan berbentuk pil: yang dipilih hitam bercentang, yang belum bergaris dengan tanda tambah */}
                {/* tiga pil sebaris; di HP yang sangat sempit (di bawah 360px) jadi dua supaya namanya tidak terpotong */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 min-[360px]:grid-cols-3">
                  {tags.map((tag) => {
                    const checked = tagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className={cn(
                          "flex h-8 min-w-0 cursor-pointer select-none items-center gap-1 rounded-full border px-2 text-[13px] font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                          checked ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink hover:border-ink",
                        )}
                      >
                        <input
                          type="checkbox"
                          name="tags"
                          value={tag.id}
                          checked={checked}
                          onChange={(event) => {
                            setTagIds((current) => (event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id)));
                            touch();
                          }}
                          className="sr-only"
                        />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5 shrink-0">
                          {checked ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 6v12M6 12h12" />}
                        </svg>
                        <span className="truncate" title={tag.name}>
                          {tag.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <span className="text-xs text-muted">
                  {tagIds.length === 0 ? "Belum ada yang dipilih. Boleh lebih dari satu." : `${tagIds.length} dipilih. Klik lagi untuk melepas.`}
                </span>
              </>
            )}
          </div>

          <hr className="border-line" />

          <div className="flex flex-col gap-2.5">
            {published ? (
              <>
                <Button block disabled={saving} onClick={() => save(true)}>
                  {saving ? "Memproses..." : "Simpan Perubahan"}
                </Button>
                <Button block variant="secondary" disabled={saving} onClick={() => save(false)}>
                  Tarik ke Draf
                </Button>
              </>
            ) : (
              <>
                <Button block disabled={saving || !title.trim()} onClick={() => save(true)}>
                  {saving ? "Memproses..." : "Terbitkan"}
                </Button>
                <Button block variant="secondary" disabled={saving} onClick={() => save(false)}>
                  Simpan sebagai Draf
                </Button>
              </>
            )}
            {!title.trim() && !published ? <p className="text-center text-xs text-muted">Judulnya diisi dulu sebelum terbit.</p> : null}
            {error ? <FormError>{error}</FormError> : null}
          </div>
        </aside>
      </div>

      {leaveHref ? (
        <Modal open onClose={() => setLeaveHref(null)} title="Simpan Dulu?" note="Ada perubahan yang belum disimpan. Kalau keluar sekarang, perubahannya hilang.">
          <div className="flex flex-col gap-2">
            {error ? <FormError>{error}</FormError> : null}
            <Button
              block
              disabled={saving}
              onClick={() => {
                const target = leaveHref;
                save(published, () => leave(target));
              }}
            >
              {saving ? "Menyimpan..." : published ? "Simpan & Keluar" : "Simpan Draf & Keluar"}
            </Button>
            <Button
              block
              variant="secondary"
              disabled={saving}
              onClick={() => {
                const target = leaveHref;
                setLeaveHref(null);
                leave(target);
              }}
            >
              Keluar Tanpa Menyimpan
            </Button>
            <Button block variant="ghost" disabled={saving} onClick={() => setLeaveHref(null)}>
              Lanjut Nulis
            </Button>
          </div>
        </Modal>
      ) : null}

      {preview ? (
        <Modal open onClose={() => setPreview(null)} size="xl" title="Pratinjau" note="Begini tampilannya di situs. Yang tampil adalah isi sekarang, termasuk yang belum disimpan.">
          <article className="flex flex-col gap-5 pb-2">
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
              </div>
            ) : null}
            <h1 className="font-display text-[2.125rem] font-medium leading-[1.12] tracking-[-0.01em] sm:text-5xl">
              {title || <span className="text-muted">Tanpa judul</span>}
            </h1>
            {excerpt ? <p className="font-body text-xl italic leading-snug text-muted sm:text-[22px]">{excerpt}</p> : null}
            <div className="flex items-center gap-3.5 pt-2">
              <AuthorPhoto size={56} />
              <div className="flex flex-col gap-0.5 font-ui">
                <span className="text-[15px] font-semibold">{site.author}</span>
                <span className="text-[13px] text-muted">
                  {dateFormat.format(new Date())} · {readingTime(preview.html)} menit baca
                </span>
              </div>
            </div>
            {shownCover ? (
              <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl bg-(--cover)">
                <NextImage src={shownCover} alt="" fill sizes="680px" unoptimized className="mono-img object-cover" />
              </div>
            ) : null}
            <StoryBody html={preview.html} className="mt-5 font-body" />
          </article>
        </Modal>
      ) : null}

      {trackModal ? (
        <TrackModal
          tracks={tracks}
          onClose={() => setTrackModal(false)}
          onPick={(track) => {
            setTrackModal(false);
            editor?.chain().focus().insertContent({ type: "trackCard", attrs: track }).run();
          }}
        />
      ) : null}
    </form>
  );
}

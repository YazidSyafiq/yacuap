"use client";

import { useEffect, useRef, type ComponentType } from "react";
import { cn } from "@/lib/cn";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Pop up admin, gayanya mengikuti Portal Parerejo: kepala berisi judul (dengan ikon kalau diberi), tombol tutup,
 * dan keterangan di bawahnya; isi di tengah; kaki berlatar sedikit berbeda untuk tombol-tombolnya.
 * Memakai <dialog> bawaan browser, jadi fokus dan tombol Escape sudah ditangani.
 */
export function Modal({
  open,
  onClose,
  icon: Icon,
  title,
  note,
  danger = false,
  footer,
  size = "md",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** Ikon di kepala, opsional. */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  note?: string;
  danger?: boolean;
  footer?: React.ReactNode;
  /** Lebar pop up: `md` untuk formulir pendek, `lg` untuk dua kolom, `xl` untuk pratinjau selebar kolom baca. */
  size?: "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // klik di latar (di luar kotak) menutup pop up
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        // tinggi dibatasi setinggi layar dan isinya bisa digulir, untuk HP pendek dan saat keyboard terbuka
        "m-auto max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] dark:border-border-strong dark:shadow-[0_0_60px_-10px_rgba(255,255,255,0.2)]",
        size === "xl" ? "max-w-[760px]" : size === "lg" ? "max-w-3xl" : "max-w-md",
        className,
      )}
    >
      <div className="flex flex-col gap-1 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                danger ? "bg-danger/10 text-danger" : "bg-ink/10 text-ink",
              )}
            >
              <Icon className="size-[18px]" />
            </span>
          ) : null}
          <h2 className={cn("min-w-0 flex-1 truncate text-lg font-semibold", danger && "text-danger")}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        {note ? <p className={cn("text-sm text-muted", Icon && "pl-12")}>{note}</p> : null}
      </div>
      <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>
      {footer ? (
        <div className="grid gap-2 rounded-b-2xl border-t border-line bg-bg/60 px-5 py-4 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))] sm:px-6">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

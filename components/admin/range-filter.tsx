"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/admin/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { useRequired } from "@/components/ui/use-required";

export type RangeOption = { key: string; label: string; href: string };

/**
 * Pilihan rentang dashboard: beberapa pilihan cepat, plus "Kustom" yang membuka pop up berisi dua isian tanggal.
 * Pilihan cepat adalah tautan biasa; rentang kustom dikirim sebagai formulir GET (?dari=...&sampai=...),
 * jadi alamatnya bisa disimpan atau dibagikan. Isiannya di pop up supaya deretan filternya tidak berubah bentuk.
 */
export function RangeFilter({
  options,
  activeKey,
  from,
  to,
  max,
}: {
  options: RangeOption[];
  /** Kunci pilihan yang aktif, atau "kustom". */
  activeKey: string;
  /** Tanggal rentang yang sedang tampil (YYYY-MM-DD), jadi isian kustom mulai dari sana. */
  from: string;
  to: string;
  /** Tanggal paling akhir yang boleh dipilih (hari ini). */
  max: string;
}) {
  const custom = activeKey === "kustom";
  const [open, setOpen] = useState(false);
  const required = useRequired({ dari: "Tanggal awalnya diisi dulu.", sampai: "Tanggal akhirnya diisi dulu." });
  const item = "flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium lg:flex-none";

  return (
    <>
      <nav aria-label="Rentang waktu" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {options.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            aria-current={option.key === activeKey ? "page" : undefined}
            className={cn(item, option.key === activeKey ? "bg-ink text-surface" : "text-muted hover:text-ink")}
          >
            {option.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(item, custom ? "bg-ink text-surface" : "text-muted hover:text-ink")}
        >
          Kustom
        </button>
      </nav>

      {open ? (
        <Modal open onClose={() => setOpen(false)} title="Rentang Kustom" note="Pilih tanggal awal dan akhir. Semua angka dan diagram mengikuti rentang ini.">
          {/* tidak ditutup lewat state saat dikirim: halamannya berpindah sendiri, dan menutup lebih dulu bisa membatalkan pengiriman */}
          <form method="get" action="/admin" onSubmit={required.onSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="range-from">Dari Tanggal</Label>
                <Input id="range-from" type="date" name="dari" defaultValue={from} max={max} required {...required.field("dari")} />
                {required.error("dari")}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="range-to">Sampai Tanggal</Label>
                <Input id="range-to" type="date" name="sampai" defaultValue={to} max={max} required {...required.field("sampai")} />
                {required.error("sampai")}
              </div>
            </div>
            <p className="text-[13px] text-muted">Paling panjang dua tahun. Tanggal akhir tidak bisa melewati hari ini.</p>
            <div className="grid gap-2 pt-1 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
              <Button variant="secondary" size="sm" block onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" block>
                Terapkan
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

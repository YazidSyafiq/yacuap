"use client";

import Image from "next/image";
import { useState } from "react";
import { AddTrackModal } from "@/components/admin/add-track-modal";
import { Modal } from "@/components/admin/modal";
import { ShareModal } from "@/components/admin/share-modal";
import Link from "next/link";
import { ArchiveIcon, InfoIcon, PlusIcon, ShareIcon } from "@/components/admin/icons";
import type { TrackOption } from "@/lib/admin/tracks";
import { CHART_SIZE, chartWeekLabel, daysLeft, isoWeek } from "@/lib/chart";
import { cn } from "@/lib/cn";
import { ModalActions, TrackSummary, type Track } from "../playlist/forms";
import { addChartTrack, removeChartTrack, saveChart } from "./actions";
import { fileSlug } from "@/lib/file-slug";
import { CHART_STYLES } from "@/lib/share/styles";
import { TrackEditor } from "@/components/admin/track-editor";
import { iconOnDark } from "@/components/admin/styles";

export type ChartTrack = Track & { lastPosition: number | null; weeks: number };
export type ChartInfo = { title: string; description: string; chartFrom: string | null; chartTo: string | null };

function RemoveChartTrackModal({ track, onClose }: { track: ChartTrack; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title="Keluarkan dari Chart?" note="Lagunya keluar dari chart saja; tetap tersimpan dan tetap ada di playlist yang memuatnya. Lagu di bawahnya naik satu." danger>
      <form action={removeChartTrack} onSubmit={onClose} className="flex flex-col gap-4">
        <input type="hidden" name="trackId" value={track.id} />
        <TrackSummary track={track} />
        <ModalActions onClose={onClose} submit="Keluarkan" danger />
      </form>
    </Modal>
  );
}

type ModalState = { kind: "add" } | { kind: "share" } | { kind: "share-track"; track: ChartTrack; position: number } | { kind: "info" } | { kind: "remove"; track: ChartTrack } | null;

/** Pop up cara kerja chart, dibuka dari ikon info di kartu. */
function InfoModal({ onClose }: { onClose: () => void }) {
  const steps = [
    `${CHART_SIZE} lagu yang paling sering diputar seminggu belakangan. Tampil paling depan di beranda dan di halaman /chart.`,
    "Minggunya maju sendiri tiap Senin. Saat itu posisi sekarang otomatis jadi posisi minggu lalu, dan lama bertahan tiap lagu bertambah satu.",
    "Tambah lagu lewat ikon tambah, dari lagu yang sudah ada di playlist mana pun atau tautan YouTube baru. Keluarkan yang sudah jarang diputar.",
    "Susun urutannya dengan menyeret pegangan di kiri atau memakai panah naik turun. Posisi minggu lalu dan tanda naik turunnya hanya informasi, terisi sendiri.",
    "Tulis catatan kenapa lagu itu masuk lewat ikon catatan. Semua perubahan ditahan dulu, lalu dikirim sekaligus lewat tombol Simpan.",
  ];
  return (
    <Modal open onClose={onClose} title="Cara kerja chart" note="Tugasmu cuma menyusun lagunya. Tanggal, tanda naik turun, dan lama bertahan dihitung sendiri.">
      <ol className="flex flex-col gap-3 text-sm text-ink-soft">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink font-ui text-[12px] font-semibold text-bg">{i + 1}</span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </Modal>
  );
}

/** Tombol ikon bulat di atas latar gelap kartu. */

/**
 * Halaman Chart di admin, selebar halaman seperti daftar playlist. Judul, keterangan, dan rentang minggu chart tidak
 * diatur dari sini: minggunya maju sendiri (fungsi `chart_rollover`, dipanggil saat halaman ini dibuka dan oleh ping harian),
 * jadi yang dikerjakan penulis hanya isi lagunya lewat editor di bawah.
 */
export function ChartAdmin({ chart, tracks, options }: { chart: ChartInfo; tracks: ChartTrack[]; options: TrackOption[] }) {
  const [modal, setModal] = useState<ModalState>(null);
  const [dirty, setDirty] = useState(false);
  const close = () => setModal(null);
  const week = chartWeekLabel(chart.chartFrom, chart.chartTo);
  const weekNo = isoWeek(chart.chartFrom);
  const left = daysLeft(chart.chartTo);
  const version = `${tracks.length}:${tracks.map((track) => `${track.id.slice(0, 4)}${track.lastPosition ?? ""}`).join("")}`;
  const artworks = tracks.flatMap((track) => (track.artwork ? [track.artwork] : []));
  const empty = Math.max(CHART_SIZE - tracks.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ringkasan chart, gayanya sama dengan kartu chart di halaman /playlist: mosaik jadi latar gelap, lencana minggu, judul, keterangan, lima teratas */}
      <section className="relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-3xl bg-[#111111] text-white">
        <div aria-hidden="true" className={cn("absolute inset-0 grid", artworks.length >= 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1")}>
          {(artworks.length >= 4 ? artworks.slice(0, 4) : artworks.slice(0, 1)).map((src) => (
            <span key={src} className="relative">
              <Image src={src} alt="" fill sizes="100vw" unoptimized className="mono-img object-cover" />
            </span>
          ))}
        </div>
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(17,17,17,0.92)_0%,rgba(17,17,17,0.72)_45%,rgba(17,17,17,0.35)_100%)]" />
        {/* tindakan sebagai ikon di pojok kanan atas kartu: tambah lagu dan kartu bagikan */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-6 sm:top-6">
          <button type="button" onClick={() => setModal({ kind: "info" })} aria-label="Cara kerja chart" title="Cara kerjanya" className={iconOnDark}>
            <InfoIcon className="size-[18px]" />
          </button>
          <Link href="/admin/chart/riwayat" aria-label="Riwayat chart" title="Riwayat minggu-minggu sebelumnya" className={iconOnDark}>
            <ArchiveIcon className="size-[18px]" />
          </Link>
          <button
            type="button"
            onClick={() => setModal({ kind: "share" })}
            disabled={tracks.length === 0 || dirty}
            aria-label="Kartu bagikan"
            title={dirty ? "Simpan dulu perubahanmu" : "Kartu bagikan"}
            className={iconOnDark}
          >
            <ShareIcon className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setModal({ kind: "add" })}
            disabled={empty === 0 || dirty}
            aria-label="Tambah lagu"
            title={dirty ? "Simpan dulu perubahanmu" : empty === 0 ? `Chart sudah penuh, ${CHART_SIZE} lagu` : "Tambah lagu"}
            className={iconOnDark}
          >
            <PlusIcon className="size-[18px]" />
          </button>
        </div>
        <div className="relative flex flex-col gap-5 p-5 pt-16 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex h-[26px] items-center whitespace-nowrap rounded-full border border-white px-2.5 font-ui text-[12px] font-semibold uppercase tracking-[0.06em] text-white">
                {week || "Minggu ini"}
              </span>
              {weekNo ? <span className="font-ui text-[13px] font-medium text-[#cfcfcf]">minggu ke-{weekNo}</span> : null}
              {left != null ? <span className="font-ui text-[13px] font-medium text-[#cfcfcf]">{left === 0 ? "hari terakhir, besok maju sendiri" : `${left} hari lagi, lalu maju sendiri`}</span> : null}
            </div>
            <span className="font-display text-[1.75rem] font-medium leading-tight sm:text-[2.25rem]">{chart.title}</span>
            {chart.description ? <span className="max-w-[560px] text-[15px] leading-relaxed text-[#cfcfcf] sm:text-[16px]">{chart.description}</span> : null}
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
          <div className="flex shrink-0 items-center gap-6">
            <div className="flex flex-col">
              <span className="font-display text-3xl font-medium leading-none">
                {tracks.length}
                <span className="text-lg text-[#cfcfcf]"> / {CHART_SIZE}</span>
              </span>
              <span className="font-ui text-[12px] text-[#cfcfcf]">lagu terisi</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-3xl font-medium leading-none">{empty}</span>
              <span className="font-ui text-[12px] text-[#cfcfcf]">slot kosong</span>
            </div>
          </div>
        </div>
      </section>

      <TrackEditor
        kind="chart"
        tracks={tracks}
        max={CHART_SIZE}
        action={saveChart}
        emptyText="Chart-nya masih kosong. Tambah lewat ikon tambah di kartu, dari lagu yang sudah ada atau tautan YouTube."
        onAdd={() => setModal({ kind: "add" })}
        onRemove={(track) => setModal({ kind: "remove", track: track as ChartTrack })}
        onShare={(track, position) => setModal({ kind: "share-track", track: track as ChartTrack, position })}
        onDirtyChange={setDirty}
      />

      {modal?.kind === "add" ? <AddTrackModal title="Tambah Lagu ke Chart" options={options} exclude={new Set(tracks.map((track) => track.id))} action={addChartTrack} onClose={close} /> : null}
      {modal?.kind === "info" ? <InfoModal onClose={close} /> : null}
      {modal?.kind === "share" ? (
        <ShareModal
          title="Bagikan Chart"
          note="Dua gaya, koran atau tiket, sepuluh lagu per halaman. Unduh satu per satu atau semuanya sekaligus, lalu unggah berurutan."
          src="/api/chart"
          zipSrc="/api/chart/zip"
          styles={CHART_STYLES}
          pages={Math.max(1, Math.ceil(tracks.length / 10))}
          version={version}
          fileName="chart-minggu-ini"
          alt="Kartu chart minggu ini"
          onClose={close}
        />
      ) : null}
      {modal?.kind === "share-track" ? (
        <ShareModal
          key={modal.track.id}
          title="Bagikan Lagu"
          note={`${modal.track.title}, posisi ${modal.position} minggu ini. Satu gambar, gaya koran atau tiket.`}
          src={`/api/chart/lagu/${modal.track.id}`}
          styles={CHART_STYLES}
          version={version}
          fileName={`chart-${String(modal.position).padStart(2, "0")}-${fileSlug(modal.track.title)}`}
          alt={`Kartu lagu ${modal.track.title}`}
          onClose={close}
        />
      ) : null}
      {modal?.kind === "remove" ? <RemoveChartTrackModal key={modal.track.id} track={modal.track} onClose={close} /> : null}
    </div>
  );
}

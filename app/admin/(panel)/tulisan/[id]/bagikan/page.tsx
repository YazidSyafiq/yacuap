import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackIcon, DownloadIcon } from "@/components/admin/icons";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ITEM_LABELS, SHARE_SELECT, shareFileName, shareSequence, toSharePost, type ShareRow } from "@/lib/share/data";

export const metadata: Metadata = { title: "Bagikan" };

const RATIOS = [
  { key: "4x5", label: "Instagram", note: "4:5 · 1080 x 1350", platform: "instagram", limit: 20 },
  { key: "9x16", label: "TikTok & Story", note: "9:16 · 1080 x 1920", platform: "tiktok", limit: 35 },
] as const;

/**
 * Kartu bagikan sebuah tulisan: pratinjau semua gambar (urut seperti urutan unggah) dan tombol unduh (satuan dan zip).
 * Semuanya dibuat otomatis dari isi tulisan oleh /api/share/[slug]; tidak ada yang perlu diatur atau dipilih di sini.
 */
export default async function SharePage({ params, searchParams }: PageProps<"/admin/tulisan/[id]/bagikan">) {
  const { id } = await params;
  const { rasio } = await searchParams;
  const ratio = RATIOS.find((item) => item.key === rasio) ?? RATIOS[0];

  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("posts").select(`${SHARE_SELECT}, status, updated_at`).eq("id", id).maybeSingle();
  if (!data) notFound();
  const row = data as unknown as ShareRow & { status: "draft" | "published"; updated_at: string };
  const post = toSharePost(row);
  const published = row.status === "published";

  // versi ikut di alamat gambar, supaya pratinjau langsung berganti setelah tulisannya diubah
  const version = new Date(row.updated_at).getTime();
  const base = `/api/share/${post.slug}`;
  const sequence = shareSequence(post);
  const total = sequence.length;
  const cards = sequence.map((item, i) => ({
    key: `gambar-${i}`,
    label: `${i + 1}/${total} · ${ITEM_LABELS[item.type]}`,
    file: shareFileName(item, i),
    src: `${base}?rasio=${ratio.key}&n=${i}&v=${version}`,
  }));
  const quoteCount = post.quotes.length;
  const textCount = post.slides.length;

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/admin/tulisan/${id}`} className="flex items-center gap-1.5 self-start text-sm font-semibold text-muted hover:text-ink">
        <BackIcon className="size-4" />
        Kembali ke tulisan
      </Link>

      <AdminPageHeader
        title="Bagikan"
        note={post.title || "Tanpa judul"}
        action={
          published ? (
            <a href={`${base}/zip?rasio=${ratio.key}`} className={buttonClass("primary", "md", undefined, "sm")}>
              <DownloadIcon className="size-4" />
              Unduh Semua (zip)
            </a>
          ) : undefined
        }
      />

      {!published ? (
        <p className="rounded-2xl border border-line bg-surface px-5 py-4 text-[15px] text-muted">
          Tulisannya masih draf. Kartu bagikan dibuat otomatis begitu tulisannya terbit.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Ukuran gambar" className="flex gap-1 self-start rounded-xl border border-line bg-surface p-1">
              {RATIOS.map((item) => (
                <Link
                  key={item.key}
                  href={item.key === "4x5" ? `/admin/tulisan/${id}/bagikan` : `/admin/tulisan/${id}/bagikan?rasio=${item.key}`}
                  aria-current={item.key === ratio.key ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
                    item.key === ratio.key ? "bg-ink text-surface" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="text-xs text-muted">
              {ratio.note} · {cards.length} gambar
              {ratio.key === "9x16" ? " · sisi kanan dan bawah sengaja kosong buat ikon dan caption TikTok" : ""}
            </p>
          </div>

          <p className="rounded-2xl border border-line bg-surface px-5 py-4 text-sm text-muted">
            Semuanya dibuat otomatis dari <span className="font-semibold text-ink">seluruh isi tulisan</span>, {total} gambar yang tinggal diunggah berurutan: 1 kartu judul,{" "}
            {quoteCount > 0 ? `${quoteCount} kartu kutipan, ` : ""}
            {textCount} slide isi, dan 1 slide penutup berisi ajakan baca di web dengan kode QR.
            {quoteCount === 0 ? " Tulisan ini tidak punya kutipan, jadi tidak ada kartu kutipan." : ""}
            {total > ratio.limit ? (
              <span className="mt-1 block font-medium text-danger">
                {ratio.label} menerima paling banyak {ratio.limit} gambar per unggahan, sedangkan tulisan ini jadi {total} gambar. Unggahannya perlu dibagi dua.
              </span>
            ) : null}
          </p>

          <ul className={cn("grid gap-4", ratio.key === "9x16" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-4")}>
            {cards.map((card) => (
              <li key={card.key} className="flex flex-col gap-2">
                {/* gambar hasil buatan server, ukurannya sudah final; tidak perlu dioptimalkan lagi */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.src}
                  alt={card.label}
                  loading="lazy"
                  className={cn("w-full rounded-xl border border-line bg-(--cover)", ratio.key === "9x16" ? "aspect-[9/16]" : "aspect-[4/5]")}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium">{card.label}</span>
                  <a
                    href={card.src}
                    download={`${post.slug}-${ratio.platform}-${card.file}`}
                    aria-label={`Unduh ${card.label}`}
                    title="Unduh"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                  >
                    <DownloadIcon className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

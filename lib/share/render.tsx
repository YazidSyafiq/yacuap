import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { absoluteUrl, site } from "@/lib/site";
import { shareSequence, type ShareBlock, type SharePost, type ShareRatio } from "./data";

/**
 * Kartu bagikan: gambar PNG siap unggah, dibuat dari data tulisan dengan ImageResponse (next/og).
 * Warna dan hurufnya sama dengan situs. Tata letaknya mengikuti mockup yang sudah disetujui:
 * kartu judul, kartu kutipan, dan slide carousel, masing-masing untuk 4:5 (Instagram) dan 9:16 (TikTok, Story).
 * Di 9:16 sisi kanan dan bawah dikosongkan, karena di sana TikTok menaruh ikon dan caption.
 */

const INK = "#111111";
const BG = "#f4f4f4";
const MUTED = "#6a6a6a";
const LINE = "#dcdcdc";

/** `urut`: gambar ke-n dalam urutan unggah (lihat shareSequence). `og`: gambar pratinjau tautan. */
export type ShareKind = "urut" | "og";

export const SIZES: Record<ShareRatio, { width: number; height: number }> = {
  "4x5": { width: 1080, height: 1350 },
  "9x16": { width: 1080, height: 1920 },
};
const OG_SIZE = { width: 1200, height: 630 };

// File huruf dan logo tidak bergantung pada permintaan, jadi dibaca sekali saja.
// Tiap alamat ditulis lengkap di tempatnya (bukan lewat fungsi pembantu), supaya saat build hanya file-file ini
// yang ikut dibawa ke server, bukan seluruh proyek.
const toArrayBuffer = (buffer: Buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
const fontsPromise = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/fraunces-500.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/fraunces-600.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/fraunces-400-italic.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/newsreader-400.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/newsreader-400-italic.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/instrument-sans-500.ttf")).then(toArrayBuffer),
  readFile(join(process.cwd(), "assets/fonts/instrument-sans-600.ttf")).then(toArrayBuffer),
]).then(([fraunces500, fraunces600, frauncesItalic, newsreader, newsreaderItalic, instrument500, instrument600]) => [
  { name: "Fraunces", data: fraunces500, weight: 500 as const, style: "normal" as const },
  { name: "Fraunces", data: fraunces600, weight: 600 as const, style: "normal" as const },
  { name: "Fraunces", data: frauncesItalic, weight: 400 as const, style: "italic" as const },
  { name: "Newsreader", data: newsreader, weight: 400 as const, style: "normal" as const },
  { name: "Newsreader", data: newsreaderItalic, weight: 400 as const, style: "italic" as const },
  { name: "Instrument Sans", data: instrument500, weight: 500 as const, style: "normal" as const },
  { name: "Instrument Sans", data: instrument600, weight: 600 as const, style: "normal" as const },
]);
const dataUri = (buffer: Buffer, type: string) => `data:${type};base64,${buffer.toString("base64")}`;
const logoPromise = readFile(join(process.cwd(), "public/logo/yacuap-lockup-horizontal.png")).then((buffer) => dataUri(buffer, "image/png"));
const markPromise = readFile(join(process.cwd(), "public/logo/yacuap-mark-putih.png")).then((buffer) => dataUri(buffer, "image/png"));

/** Cover dari penyimpanan (WebP) diubah jadi JPEG, karena pembuat gambarnya tidak membaca WebP. */
async function coverData(url: string | null, width: number, height: number) {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(width, height, { fit: "cover" })
      .grayscale()
      .jpeg({ quality: 86 })
      .toBuffer();
    return dataUri(jpeg, "image/jpeg");
  } catch {
    return null;
  }
}

/**
 * Judul panjang: ukuran hurufnya turun bertingkat menurut jumlah karakter, dihitung supaya tetap muat di ruangnya
 * (kira-kira 3 baris di ukuran penuh sampai 6 baris di ukuran terkecil). Judul yang masih kelewat panjang dipotong
 * dengan elipsis, supaya tidak pernah menabrak logo di bawahnya.
 */
const TITLE_LIMIT = 190;
function fitTitle(title: string, base: number) {
  const text = title.length > TITLE_LIMIT ? `${title.slice(0, TITLE_LIMIT - 1).trimEnd()}…` : title;
  const scale = text.length > 150 ? 0.56 : text.length > 105 ? 0.66 : text.length > 60 ? 0.82 : 1;
  return { text, size: Math.round(base * scale) };
}

function Logo({ src, height }: { src: string; height: number }) {
  // rasio aset 1132 x 382
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={Math.round((height * 1132) / 382)} height={height} />;
}

function Chip({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 22px",
        borderRadius: 999,
        background: INK,
        color: "#ffffff",
        fontFamily: "Instrument Sans",
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

type Frame = { width: number; height: number; tall: boolean };

/** Kartu judul: cover di atas, lalu tag, judul, logo, dan nama penulis. Dipakai juga sebagai slide pertama carousel. */
function TitleCard({ post, frame, cover, logo, mark }: { post: SharePost; frame: Frame; cover: string | null; logo: string; mark: string }) {
  const title = fitTitle(post.title, 78);
  // judul yang panjang diberi ruang lebih: covernya dipendekkan
  const long = title.text.length > 105;
  const coverHeight = frame.tall ? (long ? 760 : 860) : long ? 620 : 720;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BG, color: INK }}>
      <div style={{ display: "flex", height: coverHeight, width: "100%", background: cover ? "#c4c4c4" : INK, alignItems: "center", justifyContent: "center" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={frame.width} height={coverHeight} style={{ objectFit: "cover" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mark} alt="" width={262} height={240} />
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          // di 9:16 sisi kanan dan bawah dikosongkan buat ikon dan caption TikTok
          padding: frame.tall ? "64px 160px 320px 72px" : "64px 72px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {post.tag ? <Chip label={post.tag} /> : null}
            <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 24, color: MUTED }}>{post.readingTime} menit baca</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 500, fontSize: title.size, lineHeight: 1.08, letterSpacing: "-0.01em" }}>{title.text}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Logo src={logo} height={57} />
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 26, color: MUTED }}>Ditulis {site.author}</div>
        </div>
      </div>
    </div>
  );
}

/** Kartu kutipan: tanda kutip besar, kutipan andalan miring, garis aksen, lalu judul tulisannya. */
function QuoteCard({ post, quote, frame, logo }: { post: SharePost; quote: string; frame: Frame; logo: string }) {
  const quoteSize = quote.length > 150 ? 58 : quote.length > 100 ? 66 : frame.tall ? 78 : 72;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BG,
        color: INK,
        padding: frame.tall ? "200px 160px 320px 88px" : "88px 88px 80px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo src={logo} height={57} />
        {post.tag ? <Chip label={post.tag} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 500, fontSize: frame.tall ? 180 : 160, lineHeight: 0.6, color: LINE }}>“</div>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: quoteSize, lineHeight: 1.25 }}>{quote}</div>
        <div style={{ display: "flex", width: 96, height: 3, background: INK }} />
        <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Newsreader", fontSize: 34, lineHeight: 1.4, color: MUTED }}>
          <span style={{ marginRight: 10 }}>dari</span>
          <span style={{ color: INK }}>{fitTitle(post.title, 34).text}</span>
        </div>
      </div>
      <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 28, color: MUTED }}>Ditulis {site.author}</div>
    </div>
  );
}

/** Kepala dan kaki yang sama di semua slide carousel: logo dan judul di atas, penanda halaman di bawah. */
function SlideShell({ post, frame, logo, index, total, children }: { post: SharePost; frame: Frame; logo: string; index: number; total: number; children: React.ReactNode }) {
  const shortTitle = post.title.length > 46 ? `${post.title.slice(0, 44).trimEnd()}…` : post.title;
  // penanda halaman berupa garis-garis; kalau slidenya banyak, garisnya dipendekkan supaya tetap muat
  const dash = total > 14 ? 14 : total > 9 ? 22 : 40;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: BG,
        color: INK,
        padding: frame.tall ? "200px 160px 320px 88px" : "80px 88px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
        <Logo src={logo} height={52} />
        <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 22, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>
          {shortTitle}
        </div>
      </div>
      {children}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", gap: total > 14 ? 6 : 10 }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{ display: "flex", width: dash, height: 6, background: i === index ? INK : LINE }} />
          ))}
        </div>
        <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 26, color: MUTED }}>
          {index + 1} / {total}
          {index < total - 1 ? " · geser" : ""}
        </div>
      </div>
    </div>
  );
}

/** Slide isi: satu atau beberapa potong tulisan (judul bagian, paragraf, kutipan), hurufnya menyesuaikan banyaknya teks. */
function TextSlide({ blocks }: { blocks: ShareBlock[] }) {
  const length = blocks.reduce((sum, block) => sum + block.text.length, 0);
  const size = length > 330 ? 40 : length > 220 ? 44 : 50;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: Math.round(size * 0.7) }}>
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <div key={i} style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: size + 12, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
            {block.text}
          </div>
        ) : block.type === "quote" ? (
          // kutipan di tengah isi: tanda kutip besar yang pudar, teks tebal, lalu garis aksen (gaya pop up ocehan di situs)
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: 150, lineHeight: 0.62, height: 62, color: LINE }}>“</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: size + 8, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{block.text}</div>
            <div style={{ display: "flex", width: 72, height: 5, borderRadius: 999, background: INK }} />
          </div>
        ) : (
          <div key={i} style={{ display: "flex", fontFamily: "Newsreader", fontSize: size, lineHeight: 1.5 }}>
            {block.text}
          </div>
        ),
      )}
    </div>
  );
}

/** Slide penutup: ajakan membaca langsung di situs, dengan kode QR dan alamat tulisannya. */
function ClosingSlide({ post, qr, link }: { post: SharePost; qr: string; link: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 500, fontSize: 76, lineHeight: 1.08, letterSpacing: "-0.01em" }}>Enakan baca langsung di webnya.</div>
        <div style={{ display: "flex", fontFamily: "Newsreader", fontSize: 36, lineHeight: 1.4, color: MUTED }}>
          Bacanya lebih enak, bisa ikut komentar, dan masih ada tulisan lain yang nungguin.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ display: "flex", padding: 20, background: "#ffffff", border: `3px solid ${INK}`, borderRadius: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="" width={300} height={300} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>Pindai, atau ketik</div>
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: link.length > 60 ? 28 : 34, lineHeight: 1.3, wordBreak: "break-all" }}>{link}</div>
          <div style={{ display: "flex", fontFamily: "Newsreader", fontStyle: "italic", fontSize: 30, lineHeight: 1.35, color: MUTED }}>{fitTitle(post.title, 30).text}</div>
        </div>
      </div>
    </div>
  );
}

/** Gambar pratinjau tautan (1200 x 630): judul di kiri, cover di kanan. */
function OgCard({ post, cover, logo }: { post: SharePost; cover: string | null; logo: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: BG, color: INK }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, padding: "56px 56px 52px", width: cover ? 720 : 1200 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex" }}>{post.tag ? <Chip label={post.tag} /> : null}</div>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 500, fontSize: fitTitle(post.title, 60).size, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {fitTitle(post.title, 60).text}
          </div>
        </div>
        <Logo src={logo} height={48} />
      </div>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" width={480} height={630} style={{ objectFit: "cover" }} />
      ) : null}
    </div>
  );
}

/**
 * Membuat satu gambar. `index` adalah nomor urut dalam urutan unggah (mulai 0): kartu judul, kartu-kartu kutipan,
 * slide-slide isi, lalu slide penutup. Penanda halaman di slide isi dan penutup memakai nomor urut yang sama,
 * jadi kalau ada satu kutipan, slide isi pertama bernomor 3.
 * Mengembalikan null kalau nomornya di luar jangkauan.
 */
export async function renderShare(post: SharePost, kind: ShareKind, ratio: ShareRatio, index = 0): Promise<ImageResponse | null> {
  const [fonts, logo, mark] = await Promise.all([fontsPromise, logoPromise, markPromise]);

  if (kind === "og") {
    const cover = await coverData(post.cover, 480, 630);
    return new ImageResponse(<OgCard post={post} cover={cover} logo={logo} />, { ...OG_SIZE, fonts });
  }

  const size = SIZES[ratio];
  const frame: Frame = { ...size, tall: ratio === "9x16" };
  const sequence = shareSequence(post);
  const item = sequence[index];
  if (!item) return null;
  const total = sequence.length;

  if (item.type === "title") {
    const long = fitTitle(post.title, 78).text.length > 105;
    const cover = await coverData(post.cover, size.width, frame.tall ? (long ? 760 : 860) : long ? 620 : 720);
    return new ImageResponse(<TitleCard post={post} frame={frame} cover={cover} logo={logo} mark={mark} />, { ...size, fonts });
  }

  if (item.type === "quote") {
    return new ImageResponse(<QuoteCard post={post} quote={item.text} frame={frame} logo={logo} />, { ...size, fonts });
  }

  if (item.type === "closing") {
    // alamat tulisan untuk kode QR dan teksnya; di kartu ditulis tanpa "https://" supaya ringkas
    const url = absoluteUrl(`/tulisan/${post.slug}`);
    const qr = await QRCode.toDataURL(url, { margin: 0, width: 600, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
    return new ImageResponse(
      (
        <SlideShell post={post} frame={frame} logo={logo} index={index} total={total}>
          <ClosingSlide post={post} qr={qr} link={url.replace(/^https?:\/\//, "")} />
        </SlideShell>
      ),
      { ...size, fonts },
    );
  }

  return new ImageResponse(
    (
      <SlideShell post={post} frame={frame} logo={logo} index={index} total={total}>
        <TextSlide blocks={item.blocks} />
      </SlideShell>
    ),
    { ...size, fonts },
  );
}

import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { CHART_SIZE, chartWeekLabel, chartWeekLabelShort, isoWeek, movementOf } from "@/lib/chart";
import type { Chart, Playlist, PlaylistTrack } from "@/lib/playlist";
import { qrUrl, site } from "@/lib/site";
import { shareSequence, type ShareBlock, type SharePost, type ShareRatio } from "./data";
import type { ChartStyle } from "./styles";

export type { ChartStyle } from "./styles";

/**
 * Kartu bagikan: gambar PNG siap unggah, dibuat dari data tulisan dengan ImageResponse (next/og).
 * Warna dan hurufnya sama dengan situs. Tata letaknya mengikuti mockup yang sudah disetujui:
 * kartu judul, kartu kutipan, dan slide carousel, masing-masing untuk 4:5 (Instagram) dan 9:16 (TikTok, Story).
 * Di 9:16 sisi kanan dan bawah dikosongkan, karena di sana TikTok menaruh ikon dan caption.
 */

const INK = "#111111";
const BG = "#ffffff";
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

/**
 * Kartu kutipan: tanda kutip besar, kutipan miring, garis aksen, lalu judul tulisan asalnya.
 * Dipakai juga untuk ocehan: labelnya "Ocehan" dan tanpa baris "dari", karena ocehan berdiri sendiri.
 */
function QuoteCard({ quote, label, source, frame, logo }: { quote: string; label: string | null; source: string | null; frame: Frame; logo: string }) {
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
        {label ? <Chip label={label} /> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 500, fontSize: frame.tall ? 180 : 160, lineHeight: 0.6, color: LINE }}>“</div>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: quoteSize, lineHeight: 1.25 }}>{quote}</div>
        <div style={{ display: "flex", width: 96, height: 3, background: INK }} />
        {source ? (
          <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Newsreader", fontSize: 34, lineHeight: 1.4, color: MUTED }}>
            <span style={{ marginRight: 10 }}>dari</span>
            <span style={{ color: INK }}>{fitTitle(source, 34).text}</span>
          </div>
        ) : null}
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

/** Slide penutup: ajakan membaca langsung di situs, dengan kode QR dan arahan ke tautan di bio. Alamat situs sengaja tidak ditulis. */
function ClosingSlide({ post, qr }: { post: SharePost; qr: string }) {
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
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>Pindai kodenya</div>
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 34, lineHeight: 1.3 }}>atau buka webnya lewat tautan di bio.</div>
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
    return new ImageResponse(<QuoteCard quote={item.text} label={post.tag} source={post.title} frame={frame} logo={logo} />, { ...size, fonts });
  }

  if (item.type === "closing") {
    // kode QR berisi alamat tetap `<qrBase>/r/<slug>`, bukan domain situs, supaya tetap hidup kalau domain berganti
    const qr = await QRCode.toDataURL(qrUrl(post.slug), { margin: 0, width: 600, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } });
    return new ImageResponse(
      (
        <SlideShell post={post} frame={frame} logo={logo} index={index} total={total}>
          <ClosingSlide post={post} qr={qr} />
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

/** Kartu satu ocehan, bergaya kartu kutipan. */
export async function renderQuip(text: string, ratio: ShareRatio) {
  const [fonts, logo] = await Promise.all([fontsPromise, logoPromise]);
  const size = SIZES[ratio];
  const frame: Frame = { ...size, tall: ratio === "9x16" };
  return new ImageResponse(<QuoteCard quote={text} label="Ocehan" source={null} frame={frame} logo={logo} />, { ...size, fonts });
}

// ---------------------------------------------------------------- chart dan playlist

export const CHART_PAGE_SIZE = 10;

const monthYearLong = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
const monthYearShort = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
const PLAYLIST_TAGLINE = "Lagu-lagu buat suasana tertentu, disusun pelan-pelan, tiap lagu ada ceritanya.";


/** Jumlah halaman kartu chart untuk isi sekarang, paling sedikit satu. */
export function chartPageCount(chart: Chart) {
  return Math.max(1, Math.ceil(chart.tracks.length / CHART_PAGE_SIZE));
}

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Tanda gerak versi koran: segitiga kecil dengan selisih, garis untuk tetap, "BARU" untuk yang baru. */
function NewsMovement({ position, lastPosition, size = 13 }: { position: number; lastPosition: number | null; size?: number }) {
  const move = movementOf(position, lastPosition);
  const style = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: size, letterSpacing: "0.04em" } as const;
  if (move.kind === "new") return <div style={{ display: "flex", ...style, letterSpacing: "0.1em", color: INK }}>BARU</div>;
  if (move.kind === "same") return <div style={{ display: "flex", width: size + 3, height: 3, background: MUTED, borderRadius: 2 }} />;
  const up = move.kind === "up";
  const color = up ? INK : MUTED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color, ...style }}>
      <svg width={size - 2} height={size - 2} viewBox="0 0 10 10">
        <path d={up ? "M5 1l4 6H1z" : "M5 9L1 3h8z"} fill={color} />
      </svg>
      {move.delta}
    </div>
  );
}

/** Kata untuk gerak, dipakai di label berita utama: "baru masuk", "naik 2", "turun 1", "tetap". */
function movementWords(position: number, lastPosition: number | null) {
  const move = movementOf(position, lastPosition);
  if (move.kind === "new") return "baru masuk";
  if (move.kind === "same") return "tetap";
  return `${move.kind === "up" ? "naik" : "turun"} ${move.delta}`;
}

/** Catatan bergaya kartu ocehan, seperti di tampilan HP: tanda kutip besar pudar di kiri atas, teks Fraunces miring redup. */
function NewsNote({ text, size, minHeight }: { text: string; size: number; minHeight: number }) {
  return (
    <div style={{ display: "flex", position: "relative", paddingLeft: size * 1.5, paddingTop: 2, minHeight }}>
      <div style={{ display: "flex", position: "absolute", left: 0, top: -size * 0.8, fontFamily: "Fraunces", fontWeight: 500, fontSize: size * 3, lineHeight: 1, color: LINE }}>“</div>
      <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: size, lineHeight: 1.32, color: MUTED }}>{text}</div>
    </div>
  );
}

const WEEK_LABEL = (track: PlaylistTrack) => (track.lastPosition == null || track.weeks <= 1 ? "baru masuk" : `${track.weeks} minggu`);

/** Satu lagu di kolom koran: nomor, sampul, judul, artis, catatan bergaya kutipan, lalu gerak dan lama bertahan. Tingginya mengisi kolom secara merata. */
function NewsItem({ position, track, artwork, last, plain = false }: { position: number; track: PlaylistTrack; artwork: string | null; last: boolean; plain?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0", flexGrow: 1, flexBasis: 0, ...(last ? {} : { borderBottom: `1px solid ${LINE}` }) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", width: 36, justifyContent: "flex-end", fontFamily: "Fraunces", fontWeight: 600, fontSize: 34, lineHeight: 1, letterSpacing: "-0.02em", flexShrink: 0 }}>{position}</div>
        <div style={{ display: "flex", width: 48, height: 48, background: "#c4c4c4", border: `1px solid ${LINE}`, overflow: "hidden", flexShrink: 0 }}>
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork} alt="" width={48} height={48} style={{ objectFit: "cover" }} />
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: 2 }}>
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 17, lineHeight: 1.15 }}>{cut(track.title, 22)}</div>
          <div style={{ display: "flex", fontFamily: "Newsreader", fontStyle: "italic", fontSize: 15, lineHeight: 1.2, color: MUTED }}>{cut(track.artist, 26)}</div>
        </div>
      </div>
      {track.note ? <NewsNote text={cut(track.note, plain ? 120 : 88)} size={15} minHeight={60} /> : <div style={{ display: "flex", minHeight: 60 }} />}
      {plain ? null : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NewsMovement position={position} lastPosition={track.lastPosition} />
          <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 500, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>{WEEK_LABEL(track)}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Satu halaman kartu chart bergaya koran (mockup Koran A). Baris edisi bergaris, nama koran "YACUAP" besar dengan
 * tagline dan garis ganda, lalu di halaman pertama berita utama (nomor satu, foto 300px, judul, artis, catatan) dan
 * tiga kolom berisi lagu berikutnya; halaman kedua tiga kolom penuh. Kaki: hitungan lagu dan "bersambung".
 */
function NewsChartPage({ chart, page, pages, artworks, frame, logo }: { chart: Chart | Playlist; page: number; pages: number; artworks: (string | null)[]; frame: Frame; logo: string }) {
  void logo;
  const isChart = chart.kind === "chart";
  const week = isChart ? chartWeekLabel(chart.chartFrom, chart.chartTo) : "";
  const number = isChart ? isoWeek(chart.chartFrom) : null;
  const made = isChart ? "" : monthYearLong.format(new Date(chart.createdAt));
  const start = page * CHART_PAGE_SIZE;
  const rows = chart.tracks.slice(start, start + CHART_PAGE_SIZE);
  const label = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED };
  const lead = page === 0 ? rows[0] : null;
  const rest = lead ? rows.slice(1) : rows;
  // tiga kolom, dibagi rata; sisa pembagian masuk ke kolom-kolom awal
  const per = Math.ceil(rest.length / 3);
  const columns = [rest.slice(0, per), rest.slice(per, per * 2), rest.slice(per * 2)];
  const indexOf = (track: PlaylistTrack) => rows.indexOf(track);
  const last = page === pages - 1;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BG, color: INK, padding: frame.tall ? "160px 80px 290px" : "40px 56px 36px" }}>
      {/* baris edisi */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
        <div style={{ display: "flex", ...label }}>{isChart ? (number ? `Edisi minggu ke-${number}` : "Edisi minggu ini") : "Playlist"}</div>
        <div style={{ display: "flex", ...label }}>{isChart ? week || "Minggu ini" : cut(chart.name, 40)}</div>
        <div style={{ display: "flex", ...label }}>{`Halaman ${page + 1} dari ${pages}`}</div>
      </div>
      {/* nama koran; tagline playlist memakai keterangannya */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 10px" }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: frame.tall ? 104 : 116, lineHeight: 0.9, letterSpacing: "0.02em" }}>YACUAP</div>
        <div style={{ display: "flex", marginTop: 8, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 19, color: MUTED, textAlign: "center" }}>
          {isChart ? "Koran mingguan lagu yang paling sering diputar, terbit tiap Senin." : cut(chart.description || PLAYLIST_TAGLINE, 110)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", height: 1, background: INK }} />
        <div style={{ display: "flex", height: 1, background: INK }} />
      </div>

      {/* berita utama: nomor satu */}
      {lead ? (
        <div style={{ display: "flex", gap: 24, padding: "18px 0 16px", borderBottom: `1px solid ${INK}` }}>
          <div style={{ display: "flex", width: 300, height: 300, background: "#c4c4c4", border: `1px solid ${INK}`, overflow: "hidden", flexShrink: 0 }}>
            {artworks[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artworks[0] as string} alt="" width={300} height={300} style={{ objectFit: "cover" }} />
            ) : null}
          </div>
          {/* flexBasis 0 wajib: tanpa itu kolom teks mengikuti panjang judul dan meluber keluar halaman */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, minWidth: 0, flexGrow: 1, flexBasis: 0 }}>
            <div style={{ display: "flex", ...label }}>{isChart ? `Nomor satu minggu ini, ${movementWords(1, lead.lastPosition)}` : `Lagu pertama, pembuka ${cut(chart.name, 30)}`}</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: lead.title.length > 24 ? 42 : 52, lineHeight: 0.98, letterSpacing: "-0.015em" }}>{cut(lead.title, 48)}</div>
            <div style={{ display: "flex", fontFamily: "Newsreader", fontStyle: "italic", fontSize: 24, color: MUTED }}>{cut(lead.artist, 40)}</div>
            {lead.note ? <NewsNote text={cut(lead.note, 190)} size={19} minHeight={0} /> : null}
          </div>
        </div>
      ) : null}

      {/* tiga kolom */}
      <div style={{ display: "flex", flexGrow: 1, paddingTop: 4, minHeight: 0 }}>
        {columns.map((column, c) => (
          <div
            key={c}
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              flexBasis: 0,
              minWidth: 0,
              paddingLeft: c === 0 ? 0 : 18,
              paddingRight: c === 2 ? 0 : 18,
              ...(c === 1 ? { borderLeft: `1px solid ${INK}`, borderRight: `1px solid ${INK}` } : {}),
            }}
          >
            {column.map((track, i) => (
              <NewsItem key={track.id} position={start + indexOf(track) + 1} track={track} artwork={artworks[indexOf(track)]} last={i === column.length - 1} plain={!isChart} />
            ))}
            {Array.from({ length: per - column.length }, (_, i) => (
              <div key={`kosong-${i}`} style={{ display: "flex", flexGrow: 1, flexBasis: 0 }} />
            ))}
          </div>
        ))}
      </div>

      {/* kaki halaman */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${INK}` }}>
        <div style={{ display: "flex", ...label }}>{`${start + rows.length} dari ${isChart ? CHART_SIZE : chart.tracks.length} lagu`}</div>
        <div style={{ display: "flex", ...label }}>{last ? (isChart ? "Yacuap, chart mingguan" : `Yacuap, playlist, disusun ${made}`) : `Bersambung ke halaman ${page + 2}`}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- chart bergaya tiket konser (mockup Tiket)


/** Deret batang barcode yang tetap untuk satu edisi: dihitung dari benih teks, jadi berubah tiap minggu dan tiap halaman. */
function barcodeBars(seed: string, length: number) {
  let x = 0;
  for (let i = 0; i < seed.length; i += 1) x = (x * 31 + seed.charCodeAt(i)) >>> 0;
  const next = () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
  const bars: { size: number; gap: number }[] = [];
  let used = 0;
  while (used < length) {
    const size = [2, 2, 3, 4, 6][Math.floor(next() * 5)];
    const gap = [2, 3, 4][Math.floor(next() * 3)];
    bars.push({ size, gap });
    used += size + gap;
  }
  return bars;
}

/** Tanda gerak versi tiket: pil hitam "BARU", garis pendek untuk tetap, segitiga dengan selisih. */
function TicketMovement({ position, lastPosition }: { position: number; lastPosition: number | null }) {
  const move = movementOf(position, lastPosition);
  if (move.kind === "new") {
    return <div style={{ display: "flex", padding: "3px 6px", background: INK, color: "#ffffff", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em" }}>BARU</div>;
  }
  if (move.kind === "same") return <div style={{ display: "flex", width: 14, height: 3, background: MUTED }} />;
  const up = move.kind === "up";
  const color = up ? INK : MUTED;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color, fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 13 }}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d={up ? "M5 1l4 6H1z" : "M5 9L1 3h8z"} fill={color} />
      </svg>
      {move.delta}
    </div>
  );
}

const TICKET_PAPER = "#f4f4f4";
/** Lebar badan tiket (tanpa sobekan dan ruang tepinya), untuk sampul selebar badan di kartu per lagu. */
const ticketBodyWidth = (frame: Frame) => frame.width - (frame.tall ? 160 : 96) - 212 - 3 - 74;
const TICKET_LINE = "#c9c9c9";

/**
 * Satu halaman kartu chart bergaya tiket konser (mockup Tiket): latar hitam, tiket kertas abu terang bersudut bulat,
 * badan di kiri (judul besar, kotak keterangan, setlist dengan catatan tiap lagu) dan sobekan tegak di kanan yang
 * dipisah garis putus-putus berlekuk, berisi judul yang diputar, barcode tegak, dan nomor seri.
 */
function TicketChartPage({ chart, page, pages, artworks, frame }: { chart: Chart; page: number; pages: number; artworks: (string | null)[]; frame: Frame }) {
  const week = chartWeekLabelShort(chart.chartFrom, chart.chartTo);
  const number = isoWeek(chart.chartFrom);
  const year = chart.chartFrom?.slice(0, 4) ?? "";
  const start = page * CHART_PAGE_SIZE;
  const rows = chart.tracks.slice(start, start + CHART_PAGE_SIZE);
  const serial = `YCP ${year} ${String(number ?? 0).padStart(2, "0")} ${String(page + 1).padStart(2, "0")}`;
  const label = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED };
  const bars = barcodeBars(`${serial}:${rows.map((track) => track.id.slice(0, 6)).join("")}`, 420);
  const field = (name: string, value: string, flex: number, last = false) => (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: flex, flexBasis: 0, padding: "9px 12px", ...(last ? {} : { borderRight: `1px solid ${INK}` }) }}>
      <div style={{ display: "flex", ...label }}>{name}</div>
      <div style={{ display: "flex", marginTop: 2, fontFamily: "Fraunces", fontWeight: 600, fontSize: 19, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: INK, padding: frame.tall ? "200px 80px 330px" : "56px 48px" }}>
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", borderRadius: 26, overflow: "hidden", background: TICKET_PAPER, color: INK }}>
        {/* badan tiket */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 0, padding: "34px 34px 28px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", ...label }}>Yacuap mempersembahkan</div>
            <div style={{ display: "flex", ...label }}>Tiket masuk, satu orang</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14, fontFamily: "Fraunces", fontWeight: 600, fontSize: frame.tall ? 80 : 88, lineHeight: 0.88, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
            <div style={{ display: "flex" }}>Chart</div>
            <div style={{ display: "flex" }}>Minggu Ini</div>
          </div>
          <div style={{ display: "flex", marginTop: 10, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 18, color: MUTED }}>Lagu yang paling sering diputar seminggu belakangan, lengkap sama alasannya.</div>
          <div style={{ display: "flex", marginTop: 16, border: `2px solid ${INK}` }}>
            {field("Tanggal", week || "Minggu ini", 1.6)}
            {field("Edisi", number ? `Minggu ke-${number}` : "Minggu ini", 1.1)}
            {field("Halaman", `${page + 1} dari ${pages}`, 0.8, true)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingBottom: 6, borderBottom: `2px solid ${INK}` }}>
            <div style={{ display: "flex", ...label }}>{`Setlist, posisi ${start + 1} sampai ${start + rows.length}`}</div>
            <div style={{ display: "flex", ...label }}>Catatan dari penyusun</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {rows.map((track, i) => {
              const position = start + i + 1;
              return (
                <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", flexGrow: 1, flexBasis: 0, maxHeight: 92, ...(i === rows.length - 1 ? {} : { borderBottom: `1px solid ${TICKET_LINE}` }) }}>
                  <div style={{ display: "flex", width: 34, justifyContent: "flex-end", fontFamily: "Fraunces", fontWeight: 600, fontSize: 24, letterSpacing: "-0.02em", flexShrink: 0 }}>{String(position).padStart(2, "0")}</div>
                  <div style={{ display: "flex", width: 46, height: 46, background: "#c4c4c4", overflow: "hidden", flexShrink: 0 }}>
                    {artworks[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={artworks[i] as string} alt="" width={46} height={46} style={{ objectFit: "cover" }} />
                    ) : null}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 17, lineHeight: 1.15, textTransform: "uppercase" }}>{cut(track.title, 26)}</div>
                      <div style={{ display: "flex", fontFamily: "Newsreader", fontStyle: "italic", fontSize: 14, color: MUTED }}>{cut(track.artist, 22)}</div>
                    </div>
                    {track.note ? (
                      <div style={{ display: "flex", position: "relative", paddingLeft: 16 }}>
                        <div style={{ display: "flex", position: "absolute", left: 0, top: -6, fontFamily: "Fraunces", fontWeight: 500, fontSize: 28, lineHeight: 1, color: TICKET_LINE }}>“</div>
                        <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: 13.5, lineHeight: 1.25, color: MUTED }}>{cut(track.note, 62)}</div>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", width: 48, justifyContent: "flex-end", flexShrink: 0 }}>
                    <TicketMovement position={position} lastPosition={track.lastPosition} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", paddingTop: 10, fontFamily: "Newsreader", fontSize: 12, lineHeight: 1.3, color: MUTED }}>
            Tiket ini berlaku seminggu dan diganti tiap Senin. Urutan disusun dari yang beneran diputar, bukan dari yang pengen kelihatan keren.
          </div>
        </div>

        {/* garis sobekan dengan lekukan di atas dan bawah */}
        <div style={{ display: "flex", position: "relative", width: 0, marginTop: 18, marginBottom: 18, borderLeft: `3px dashed ${INK}` }}>
          <div style={{ display: "flex", position: "absolute", left: -24, top: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
          <div style={{ display: "flex", position: "absolute", left: -24, bottom: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
        </div>

        {/* sobekan: judul diputar, barcode tegak, nomor seri */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: 212, flexShrink: 0, padding: "36px 0 30px" }}>
          {/* kotak persegi supaya putaran 90 derajat tidak menggeser teksnya (satori memutar dari sudut kotak) */}
          <div style={{ display: "flex", width: 400, height: 400, alignItems: "center", justifyContent: "center", transform: "rotate(90deg)" }}>
            <div style={{ display: "flex", whiteSpace: "nowrap", fontFamily: "Fraunces", fontWeight: 600, fontSize: 40, letterSpacing: "-0.02em", textTransform: "uppercase" }}>Chart Minggu Ini</div>
          </div>
          {/* stempel gratis, miring sedikit, di ruang kosong antara judul dan barcode */}
          <div style={{ display: "flex", transform: "rotate(-8deg)", padding: 4, border: `3px solid ${INK}`, borderRadius: 12, opacity: 0.82 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px 7px", border: `1.5px solid ${INK}`, borderRadius: 8 }}>
              <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1 }}>Gratis</div>
              <div style={{ display: "flex", marginTop: 5, fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>Bebas masuk</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", width: 56 }}>
              {bars.map((bar, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", height: bar.size, background: INK }} />
                  <div style={{ display: "flex", height: bar.gap }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 12, letterSpacing: "0.18em", color: INK }}>{serial}</div>
            <div style={{ display: "flex", ...label }}>{`Halaman ${page + 1} dari ${pages}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- satu lagu dari chart (mockup LaguKoran dan Tiket lagu C)

const NUMBER_WORDS = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas", "dua puluh"];
/** "tiga" untuk 3, angka biasa kalau di luar 1 sampai 20. */
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);
const WEEKS_WORDS = (track: PlaylistTrack) => (track.lastPosition == null || track.weeks <= 1 ? "baru masuk" : `bertahan ${track.weeks} minggu`);
const NO_NOTE = "Nggak ada catatan buat lagu ini, lagunya ngomong sendiri.";
/** Ukuran huruf catatan di tiket per lagu: catatan pendek dibaca lebih besar. */
const ticketNoteSize = (note: string) => (note.length < 140 ? 32 : note.length < 320 ? 27 : 23);

/**
 * Tinggi sampul lebar di tiket per lagu, dihitung dari ruang yang tersisa: tinggi badan dikurangi bagian-bagian yang tetap,
 * perkiraan tinggi judul dan catatan (dari jumlah huruf dan lebar badan), dan jarak lega ke tulisan kecil. Dijepit supaya
 * fotonya tidak pernah terlalu pipih atau terlalu tinggi. Diuji dengan catatan 400 huruf di kedua rasio.
 */
function ticketArtHeight(track: PlaylistTrack, frame: Frame) {
  const bodyWidth = ticketBodyWidth(frame);
  const note = track.note || NO_NOTE;
  const noteSize = ticketNoteSize(note);
  const noteLines = Math.ceil(note.length / Math.floor((bodyWidth - 38) / (noteSize * 0.47)));
  const noteHeight = 20 + noteLines * noteSize * 1.42;
  const titleSize = headlineSize(track.title, 64, 52, 42);
  const titleLines = Math.ceil(Math.min(track.title.length, 48) / Math.floor(bodyWidth / (titleSize * 0.42)));
  const titleHeight = 18 + titleLines * titleSize * 0.94;
  const inner = frame.height - (frame.tall ? 530 : 112) - 82;
  const fixed = 14 + 246 + 46 + 39 + 83 + 44 + (frame.tall ? 53 : 38);
  const room = inner - fixed - titleHeight - noteHeight - 24;
  return Math.max(220, Math.min(frame.tall ? 760 : 640, Math.round(room)));
}
/** Tinggi sampul lebar di kartu koran per lagu: makin pendek catatannya, makin besar fotonya. */
function newsImageHeight(track: PlaylistTrack, tall: boolean) {
  // ambangnya sama dengan ambang ukuran huruf badan berita; diuji dengan catatan 400 huruf di kedua rasio
  const length = (track.note || NO_NOTE).length;
  return (length < 140 ? 600 : 540) + (tall ? 160 : 0);
}
/** Ukuran judul menyusut untuk judul panjang supaya muat dua baris. */
const headlineSize = (title: string, big: number, mid: number, small: number) => (title.length <= 12 ? big : title.length <= 22 ? mid : small);

/**
 * Satu lagu bergaya koran (mockup LaguKoran): berita utama satu halaman penuh. Baris edisi dan nama koran seperti kartu chart,
 * kicker nomor dan geraknya, judul lagu sebagai headline, artis sebagai byline, sampul lebar berketerangan, catatan utuh sebagai
 * badan berita dua kolom, kotak angka, dan kaki halaman.
 */
function NewsTrackPage({ chart, position, track, artwork, frame }: { chart: Chart | Playlist; position: number; track: PlaylistTrack; artwork: string | null; frame: Frame }) {
  const isChart = chart.kind === "chart";
  const week = isChart ? chartWeekLabel(chart.chartFrom, chart.chartTo) : "";
  const number = isChart ? isoWeek(chart.chartFrom) : null;
  const made = isChart ? "" : monthYearLong.format(new Date(chart.createdAt));
  const label = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: MUTED };
  const note = track.note || NO_NOTE;
  // catatan pendek dibaca lebih besar supaya badan beritanya tidak kosong
  const body = { fontFamily: "Newsreader", fontSize: note.length < 140 ? 30 : note.length < 320 ? 24 : 20, lineHeight: 1.42, color: INK };
  const words = note.split(" ");
  const twoColumns = words.length >= 28;
  const half = Math.ceil(words.length / 2);
  const columns = twoColumns ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [note];
  const imageHeight = newsImageHeight(track, frame.tall);
  const field = (name: string, value: string, last = false) => (
    <div key={name} style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, padding: "10px 14px", ...(last ? {} : { borderRight: `1px solid ${INK}` }) }}>
      <div style={{ display: "flex", ...label }}>{name}</div>
      <div style={{ display: "flex", marginTop: 2, fontFamily: "Fraunces", fontWeight: 600, fontSize: 28, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BG, color: INK, padding: frame.tall ? "160px 80px 290px" : "40px 56px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
        <div style={{ display: "flex", ...label }}>{isChart ? (number ? `Edisi minggu ke-${number}` : "Edisi minggu ini") : "Playlist"}</div>
        <div style={{ display: "flex", ...label }}>{isChart ? week || "Minggu ini" : cut(chart.name, 40)}</div>
        <div style={{ display: "flex", ...label }}>{`Lagu ${position} dari ${chart.tracks.length}`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 10px" }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: frame.tall ? 104 : 116, lineHeight: 0.9, letterSpacing: "0.02em" }}>YACUAP</div>
        <div style={{ display: "flex", marginTop: 8, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 19, color: MUTED, textAlign: "center" }}>
          {isChart ? "Koran mingguan lagu yang paling sering diputar, terbit tiap Senin." : cut(chart.description || PLAYLIST_TAGLINE, 110)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", height: 1, background: INK }} />
        <div style={{ display: "flex", height: 1, background: INK }} />
      </div>

      {/* kicker: nomor berapa, geraknya, lama bertahan */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 10px" }}>
        <div style={{ display: "flex", ...label, color: INK }}>{isChart ? `Nomor ${numberWord(position)} minggu ini` : `Lagu ke-${position} di ${cut(chart.name, 30)}`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isChart && track.lastPosition != null ? <NewsMovement position={position} lastPosition={track.lastPosition} /> : null}
          <div style={{ display: "flex", ...label }}>{!isChart ? `disusun ${made}` : track.lastPosition == null ? "baru masuk minggu ini" : `${movementWords(position, track.lastPosition)}, ${WEEKS_WORDS(track)}`}</div>
        </div>
      </div>

      {/* headline dan byline */}
      <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: headlineSize(track.title, 84, 64, 48), lineHeight: 0.96, letterSpacing: "-0.02em" }}>{cut(track.title, 60)}</div>
      <div style={{ display: "flex", marginTop: 8, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 28, color: MUTED }}>{cut(track.artist || "Artis belum diisi", 60)}</div>

      {/* sampul lebar berketerangan */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 18, paddingTop: 16, borderTop: `1px solid ${INK}` }}>
        <div style={{ display: "flex", width: "100%", height: imageHeight, background: "#c4c4c4", border: `1px solid ${INK}`, overflow: "hidden" }}>
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork} alt="" width={frame.width - (frame.tall ? 160 : 112) - 2} height={imageHeight - 2} style={{ objectFit: "cover" }} />
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 15, color: MUTED }}>
          <div style={{ display: "flex" }}>{cut(`Sampul ${track.title}, ${track.artist || "artis belum diisi"}.`, 70)}</div>
          <div style={{ display: "flex" }}>{!isChart ? `Lagu ${position} dari ${chart.tracks.length}.` : track.lastPosition == null ? "Baru masuk minggu ini." : `Minggu lalu di posisi ${track.lastPosition}.`}</div>
        </div>
      </div>

      {/* badan berita: catatan utuh, dua kolom kalau panjang */}
      <div style={{ display: "flex", gap: 28, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${INK}`, flexGrow: 1 }}>
        {columns.map((text, i) => (
          <div key={i} style={{ display: "flex", flexGrow: 1, flexBasis: 0, ...body, ...(i === 1 ? { borderLeft: `1px solid ${INK}`, paddingLeft: 28 } : {}), ...(track.note ? {} : { fontStyle: "italic", color: MUTED }) }}>
            {text}
          </div>
        ))}
      </div>

      {/* kotak angka */}
      <div style={{ display: "flex", marginTop: 14, borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
        {isChart
          ? [
              field("Posisi", String(position)),
              field("Minggu lalu", track.lastPosition == null ? "Baru" : String(track.lastPosition)),
              field("Bertahan", track.lastPosition == null || track.weeks <= 1 ? "Baru masuk" : `${track.weeks} minggu`),
              field("Edisi", number ? `Minggu ke-${number}` : "Minggu ini", true),
            ]
          : [field("Urutan", String(position)), field("Isi playlist", `${chart.tracks.length} lagu`), field("Disusun", made, true)]}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}>
        <div style={{ display: "flex", ...label }}>{`Lagu ${position} dari ${chart.tracks.length}`}</div>
        <div style={{ display: "flex", ...label }}>{isChart ? "Yacuap, chart mingguan" : "Yacuap, playlist"}</div>
      </div>
    </div>
  );
}

/**
 * Satu lagu bergaya tiket (mockup Tiket lagu C): nomor raksasa dengan keterangan di sampingnya, sampul kecil dengan judul
 * dan artis, kotak angka, catatan utuh bergaya kutipan, dan sobekan yang tulisan tegaknya judul lagu itu sendiri.
 */
function TicketTrackPage({ chart, position, track, artwork, frame }: { chart: Chart | Playlist; position: number; track: PlaylistTrack; artwork: string | null; frame: Frame }) {
  const isChart = chart.kind === "chart";
  const week = isChart ? chartWeekLabelShort(chart.chartFrom, chart.chartTo) : "";
  const number = isChart ? isoWeek(chart.chartFrom) : null;
  const made = isChart ? null : new Date(chart.createdAt);
  const year = isChart ? (chart.chartFrom?.slice(0, 4) ?? "") : String(made?.getFullYear() ?? "");
  const serial = isChart ? `YCP ${year} ${String(number ?? 0).padStart(2, "0")} ${String(position).padStart(2, "0")}` : `YCP ${year} PL ${String(position).padStart(2, "0")}`;
  const label = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED };
  const bars = barcodeBars(`${serial}:${track.id.slice(0, 8)}`, 420);
  const note = track.note || NO_NOTE;
  const field = (name: string, value: string, flex: number, last = false) => (
    <div key={name} style={{ display: "flex", flexDirection: "column", flexGrow: flex, flexBasis: 0, padding: "9px 12px", ...(last ? {} : { borderRight: `1px solid ${INK}` }) }}>
      <div style={{ display: "flex", ...label }}>{name}</div>
      <div style={{ display: "flex", marginTop: 2, fontFamily: "Fraunces", fontWeight: 600, fontSize: 19, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
  const stubTitle = cut(track.title, 24);
  const stubSize = stubTitle.length <= 12 ? 40 : stubTitle.length <= 18 ? 32 : 26;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: INK, padding: frame.tall ? "200px 80px 330px" : "56px 48px" }}>
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", borderRadius: 26, overflow: "hidden", background: TICKET_PAPER, color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 0, padding: "34px 34px 48px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", ...label }}>Yacuap mempersembahkan</div>
            <div style={{ display: "flex", ...label }}>Tiket masuk, satu orang</div>
          </div>

          {/* nomor raksasa dengan keterangan di sampingnya */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: 6 }}>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontWeight: 600, fontSize: 300, lineHeight: 0.8, letterSpacing: "-0.06em" }}>{String(position).padStart(2, "0")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 10, minWidth: 0 }}>
              <div style={{ display: "flex", ...label, color: INK }}>{isChart ? "Chart minggu ini" : cut(chart.name, 26)}</div>
              <div style={{ display: "flex", ...label }}>{isChart ? `Dari ${chart.tracks.length} lagu, ${week || "minggu ini"}` : `Playlist ${chart.tracks.length} lagu, disusun ${made ? monthYearShort.format(made) : ""}`}</div>
              {isChart ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TicketMovement position={position} lastPosition={track.lastPosition} />
                  <div style={{ display: "flex", ...label, color: INK }}>{track.lastPosition == null ? "Minggu pertama di chart" : `${movementWords(position, track.lastPosition)}, ${WEEKS_WORDS(track)}`}</div>
                </div>
              ) : (
                <div style={{ display: "flex", ...label, color: INK }}>{`Lagu ke-${position} dari ${chart.tracks.length}`}</div>
              )}
            </div>
          </div>

          {/* sampul selebar badan tiket, lalu judul dan artis di bawahnya */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22, paddingTop: 22, borderTop: `2px solid ${INK}` }}>
            <div style={{ display: "flex", width: "100%", height: ticketArtHeight(track, frame), background: "#c4c4c4", border: `2px solid ${INK}`, overflow: "hidden" }}>
              {artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artwork} alt="" width={ticketBodyWidth(frame) - 4} height={ticketArtHeight(track, frame) - 4} style={{ objectFit: "cover" }} />
              ) : null}
            </div>
            <div style={{ display: "flex", marginTop: 18, fontFamily: "Fraunces", fontWeight: 600, fontSize: headlineSize(track.title, 64, 52, 42), lineHeight: 0.94, letterSpacing: "-0.03em", textTransform: "uppercase" }}>{cut(track.title, 48)}</div>
            <div style={{ display: "flex", marginTop: 8, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 26, color: MUTED }}>{cut(track.artist || "Artis belum diisi", 60)}</div>
          </div>

          <div style={{ display: "flex", marginTop: 22, border: `2px solid ${INK}` }}>
            {isChart
              ? [
                  field("Posisi", String(position).padStart(2, "0"), 0.8),
                  field("Minggu lalu", track.lastPosition == null ? "Baru" : String(track.lastPosition).padStart(2, "0"), 0.9),
                  field("Bertahan", track.lastPosition == null || track.weeks <= 1 ? "Baru masuk" : `${track.weeks} minggu`, 1),
                  field("Edisi", number ? `Minggu ke-${number}` : "Minggu ini", 1.2, true),
                ]
              : [
                  field("Urutan", String(position).padStart(2, "0"), 0.8),
                  field("Isi playlist", `${chart.tracks.length} lagu`, 1),
                  field("Disusun", made ? monthYearShort.format(made) : "", 1.2, true),
                ]}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, paddingBottom: 6, borderBottom: `2px solid ${INK}` }}>
            <div style={{ display: "flex", ...label }}>Catatan dari penyusun</div>
            <div style={{ display: "flex", ...label }}>Kenapa lagu ini masuk</div>
          </div>
          <div style={{ display: "flex", position: "relative", padding: "20px 0 0 38px", flexGrow: 1 }}>
            <div style={{ display: "flex", position: "absolute", left: 0, top: 2, fontFamily: "Fraunces", fontWeight: 500, fontSize: 84, lineHeight: 1, color: TICKET_LINE }}>“</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: ticketNoteSize(note), lineHeight: 1.42, color: track.note ? "#3a3a3a" : MUTED }}>{cut(note, 520)}</div>
          </div>
          <div style={{ display: "flex", paddingTop: 22, fontFamily: "Newsreader", fontSize: 12, lineHeight: 1.3, color: MUTED }}>
            {isChart
              ? "Tiket ini berlaku seminggu dan diganti tiap Senin. Posisi dihitung dari yang beneran diputar, bukan dari yang pengen kelihatan keren."
              : "Playlist ini nggak ganti tiap minggu. Urutannya disusun pelan-pelan, tiap lagu ada alasannya."}
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", width: 0, marginTop: 18, marginBottom: 18, borderLeft: `3px dashed ${INK}` }}>
          <div style={{ display: "flex", position: "absolute", left: -24, top: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
          <div style={{ display: "flex", position: "absolute", left: -24, bottom: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
        </div>

        {/* sobekan: judul lagu tegak, stempel gratis, barcode, nomor seri */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: 212, flexShrink: 0, padding: "36px 0 44px" }}>
          <div style={{ display: "flex", width: 400, height: 400, alignItems: "center", justifyContent: "center", transform: "rotate(90deg)" }}>
            <div style={{ display: "flex", whiteSpace: "nowrap", fontFamily: "Fraunces", fontWeight: 600, fontSize: stubSize, letterSpacing: "-0.02em", textTransform: "uppercase" }}>{stubTitle}</div>
          </div>
          <div style={{ display: "flex", transform: "rotate(-8deg)", padding: 4, border: `3px solid ${INK}`, borderRadius: 12, opacity: 0.82 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px 7px", border: `1.5px solid ${INK}`, borderRadius: 8 }}>
              <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1 }}>Gratis</div>
              <div style={{ display: "flex", marginTop: 5, fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>Bebas masuk</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", width: 56 }}>
              {bars.map((bar, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", height: bar.size, background: INK }} />
                  <div style={{ display: "flex", height: bar.gap }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 12, letterSpacing: "0.18em", color: INK }}>{serial}</div>
            <div style={{ display: "flex", ...label }}>{`${isChart ? "Posisi" : "Lagu"} ${position} dari ${chart.tracks.length}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- playlist, gaya koran dan tiket (sepuluh lagu per halaman)

/** Jumlah halaman kartu playlist, sepuluh lagu per halaman, paling sedikit satu. */
export function playlistPageCount(playlist: Playlist) {
  return Math.max(1, Math.ceil(playlist.tracks.length / CHART_PAGE_SIZE));
}

/**
 * Satu halaman kartu playlist bergaya tiket: nama playlist sebagai judul besar, keterangan, kotak jumlah lagu,
 * kapan disusun, dan halaman; setlist sepuluh lagu dengan catatan satu baris, tanpa tanda gerak; sobekan dengan
 * nama playlist tegak, stempel gratis, barcode, dan nomor seri.
 */
function TicketPlaylistPage({ playlist, page, pages, artworks, frame }: { playlist: Playlist; page: number; pages: number; artworks: (string | null)[]; frame: Frame }) {
  const start = page * CHART_PAGE_SIZE;
  const rows = playlist.tracks.slice(start, start + CHART_PAGE_SIZE);
  const made = new Date(playlist.createdAt);
  const serial = `YCP ${made.getFullYear()} PL ${String(page + 1).padStart(2, "0")}`;
  const label = { fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: MUTED };
  const bars = barcodeBars(`${serial}:${playlist.id.slice(0, 8)}:${page}`, 420);
  const field = (name: string, value: string, flex: number, last = false) => (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: flex, flexBasis: 0, padding: "9px 12px", ...(last ? {} : { borderRight: `1px solid ${INK}` }) }}>
      <div style={{ display: "flex", ...label }}>{name}</div>
      <div style={{ display: "flex", marginTop: 2, fontFamily: "Fraunces", fontWeight: 600, fontSize: 19, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
  const stubTitle = cut(playlist.name, 24);
  const stubSize = stubTitle.length <= 12 ? 40 : stubTitle.length <= 18 ? 32 : 26;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: INK, padding: frame.tall ? "200px 80px 330px" : "56px 48px" }}>
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", borderRadius: 26, overflow: "hidden", background: TICKET_PAPER, color: INK }}>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, minWidth: 0, padding: "34px 34px 30px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", ...label }}>Yacuap mempersembahkan</div>
            <div style={{ display: "flex", ...label }}>Tiket masuk, satu orang</div>
          </div>
          <div style={{ display: "flex", marginTop: 14, fontFamily: "Fraunces", fontWeight: 600, fontSize: headlineSize(playlist.name, frame.tall ? 72 : 80, 60, 46), lineHeight: 0.9, letterSpacing: "-0.03em", textTransform: "uppercase" }}>{cut(playlist.name, 48)}</div>
          <div style={{ display: "flex", marginTop: 10, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 18, lineHeight: 1.3, color: MUTED }}>{cut(playlist.description || PLAYLIST_TAGLINE, 140)}</div>
          <div style={{ display: "flex", marginTop: 16, border: `2px solid ${INK}` }}>
            {field("Isi", `${playlist.tracks.length} lagu`, 1)}
            {field("Disusun", monthYearShort.format(made), 1.3)}
            {field("Halaman", `${page + 1} dari ${pages}`, 1, true)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingBottom: 6, borderBottom: `2px solid ${INK}` }}>
            <div style={{ display: "flex", ...label }}>{`Setlist, lagu ${start + 1} sampai ${start + rows.length}`}</div>
            <div style={{ display: "flex", ...label }}>Catatan dari penyusun</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {rows.map((track, i) => (
              <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", flexGrow: 1, flexBasis: 0, maxHeight: 92, ...(i === rows.length - 1 ? {} : { borderBottom: `1px solid ${TICKET_LINE}` }) }}>
                <div style={{ display: "flex", width: 34, justifyContent: "flex-end", fontFamily: "Fraunces", fontWeight: 600, fontSize: 24, letterSpacing: "-0.02em", flexShrink: 0 }}>{String(start + i + 1).padStart(2, "0")}</div>
                <div style={{ display: "flex", width: 46, height: 46, background: "#c4c4c4", overflow: "hidden", flexShrink: 0 }}>
                  {artworks[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={artworks[i] as string} alt="" width={46} height={46} style={{ objectFit: "cover" }} />
                  ) : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0, gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 17, lineHeight: 1.15, textTransform: "uppercase" }}>{cut(track.title, 30)}</div>
                    <div style={{ display: "flex", fontFamily: "Newsreader", fontStyle: "italic", fontSize: 14, color: MUTED }}>{cut(track.artist, 24)}</div>
                  </div>
                  {track.note ? (
                    <div style={{ display: "flex", position: "relative", paddingLeft: 16 }}>
                      <div style={{ display: "flex", position: "absolute", left: 0, top: -6, fontFamily: "Fraunces", fontWeight: 500, fontSize: 28, lineHeight: 1, color: TICKET_LINE }}>“</div>
                      <div style={{ display: "flex", fontFamily: "Fraunces", fontStyle: "italic", fontWeight: 400, fontSize: 13.5, lineHeight: 1.25, color: MUTED }}>{cut(track.note, 72)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", paddingTop: 12, fontFamily: "Newsreader", fontSize: 12, lineHeight: 1.3, color: MUTED }}>
            Playlist ini nggak ganti tiap minggu. Urutannya disusun pelan-pelan, tiap lagu ada alasannya.
          </div>
        </div>

        <div style={{ display: "flex", position: "relative", width: 0, marginTop: 18, marginBottom: 18, borderLeft: `3px dashed ${INK}` }}>
          <div style={{ display: "flex", position: "absolute", left: -24, top: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
          <div style={{ display: "flex", position: "absolute", left: -24, bottom: -40, width: 44, height: 44, borderRadius: 999, background: INK }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", width: 212, flexShrink: 0, padding: "36px 0 30px" }}>
          <div style={{ display: "flex", width: 400, height: 400, alignItems: "center", justifyContent: "center", transform: "rotate(90deg)" }}>
            <div style={{ display: "flex", whiteSpace: "nowrap", fontFamily: "Fraunces", fontWeight: 600, fontSize: stubSize, letterSpacing: "-0.02em", textTransform: "uppercase" }}>{stubTitle}</div>
          </div>
          <div style={{ display: "flex", transform: "rotate(-8deg)", padding: 4, border: `3px solid ${INK}`, borderRadius: 12, opacity: 0.82 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 14px 7px", border: `1.5px solid ${INK}`, borderRadius: 8 }}>
              <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", lineHeight: 1 }}>Gratis</div>
              <div style={{ display: "flex", marginTop: 5, fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>Bebas masuk</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", width: 56 }}>
              {bars.map((bar, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", height: bar.size, background: INK }} />
                  <div style={{ display: "flex", height: bar.gap }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", fontFamily: "Instrument Sans", fontWeight: 600, fontSize: 12, letterSpacing: "0.18em", color: INK }}>{serial}</div>
            <div style={{ display: "flex", ...label }}>{`Halaman ${page + 1} dari ${pages}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Kartu bagikan playlist, halaman ke-`page` (mulai 0), sepuluh lagu per halaman, gaya koran atau tiket. Null kalau halamannya tidak ada. */
export async function renderPlaylistPage(playlist: Playlist, page: number, ratio: ShareRatio, style: ChartStyle = "koran") {
  const pages = playlistPageCount(playlist);
  if (page < 0 || page >= pages) return null;
  const [fonts] = await Promise.all([fontsPromise]);
  const size = SIZES[ratio];
  const frame: Frame = { ...size, tall: ratio === "9x16" };
  const rows = playlist.tracks.slice(page * CHART_PAGE_SIZE, (page + 1) * CHART_PAGE_SIZE);
  // koran: lagu pertama jadi berita utama dengan sampul besar, sama seperti chart
  const big = style === "koran" && page === 0;
  const artworks = await Promise.all(rows.map((track, i) => coverData(track.artwork, big && i === 0 ? 600 : 96, big && i === 0 ? 600 : 96)));
  const content =
    style === "tiket" ? (
      <TicketPlaylistPage playlist={playlist} page={page} pages={pages} artworks={artworks} frame={frame} />
    ) : (
      <NewsChartPage chart={playlist} page={page} pages={pages} artworks={artworks} frame={frame} logo="" />
    );
  return new ImageResponse(content, { ...size, fonts });
}

/** Kartu bagikan satu lagu dari chart atau playlist, gaya koran atau tiket. Null kalau lagunya tidak ada di sana. */
export async function renderTrackCard(chart: Chart | Playlist, trackId: string, ratio: ShareRatio, style: ChartStyle = "koran") {
  const index = chart.tracks.findIndex((track) => track.id === trackId);
  if (index < 0) return null;
  const track = chart.tracks[index];
  const [fonts] = await Promise.all([fontsPromise]);
  const size = SIZES[ratio];
  const frame: Frame = { ...size, tall: ratio === "9x16" };
  // sampul lebar dipotong sesuai bingkainya, di koran selebar halaman, di tiket selebar badan tiket
  const artwork =
    style === "koran"
      ? await coverData(track.artwork, frame.width - (frame.tall ? 160 : 112), newsImageHeight(track, frame.tall))
      : await coverData(track.artwork, ticketBodyWidth(frame), ticketArtHeight(track, frame));
  const content =
    style === "tiket" ? (
      <TicketTrackPage chart={chart} position={index + 1} track={track} artwork={artwork} frame={frame} />
    ) : (
      <NewsTrackPage chart={chart} position={index + 1} track={track} artwork={artwork} frame={frame} />
    );
  return new ImageResponse(content, { ...size, fonts });
}

/** Kartu bagikan chart, halaman ke-`page` (mulai 0), sepuluh lagu per halaman, dalam gaya koran atau tiket. Null kalau halamannya tidak ada. */
export async function renderChartPage(chart: Chart, page: number, ratio: ShareRatio, style: ChartStyle = "koran") {
  const pages = chartPageCount(chart);
  if (page < 0 || page >= pages) return null;
  const [fonts, logo] = await Promise.all([fontsPromise, logoPromise]);
  const size = SIZES[ratio];
  const frame: Frame = { ...size, tall: ratio === "9x16" };
  const rows = chart.tracks.slice(page * CHART_PAGE_SIZE, (page + 1) * CHART_PAGE_SIZE);
  const big = style === "koran" && page === 0;
  const artworks = await Promise.all(rows.map((track, i) => coverData(track.artwork, big && i === 0 ? 600 : 96, big && i === 0 ? 600 : 96)));
  const content =
    style === "tiket" ? (
      <TicketChartPage chart={chart} page={page} pages={pages} artworks={artworks} frame={frame} />
    ) : (
      <NewsChartPage chart={chart} page={page} pages={pages} artworks={artworks} frame={frame} logo={logo} />
    );
  return new ImageResponse(content, { ...size, fonts });
}

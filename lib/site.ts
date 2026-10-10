/** Konfigurasi situs. Semua URL absolut dibaca dari NEXT_PUBLIC_SITE_URL supaya pindah domain cukup ganti satu env. */
export const site = {
  name: "Yacuap",
  tagline: "Yazid cuap-cuap",
  description:
    "Apa aja yang lewat di kepala, ditulis di sini. Kadang panjang, kadang cuma sebaris, kadang nggak jelas juga.",
  author: "Yazid Syafiq Irsyad",
  authorShort: "Yazid",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /**
   * Alamat tetap yang dimasukkan ke kode QR kartu bagikan. Gambar yang sudah diunggah tidak bisa diubah,
   * jadi QR tidak boleh berisi domain yang bisa hilang: isinya alamat gratis yang dipegang selamanya
   * (halaman pengalih di GitHub Pages, folder `qr/`), dan halaman itulah yang melempar ke domain aktif.
   * Kosong berarti memakai alamat situs sendiri; rute `/r/<slug>` di aplikasi ini juga mengalihkan ke tulisannya.
   */
  qrBase: (process.env.NEXT_PUBLIC_QR_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
} as const;

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Alamat yang dimasukkan ke kode QR kartu bagikan sebuah tulisan: `<alamat tetap>/r/<slug>`. */
export function qrUrl(slug: string) {
  return `${site.qrBase}/r/${slug}`;
}

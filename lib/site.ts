/** Konfigurasi situs. Semua URL absolut dibaca dari NEXT_PUBLIC_SITE_URL supaya pindah domain cukup ganti satu env. */
export const site = {
  name: "Yacuap",
  tagline: "Yazid cuap-cuap",
  description:
    "Apa aja yang lewat di kepala, ditulis di sini. Kadang panjang, kadang cuma sebaris, kadang nggak jelas juga.",
  author: "Yazid Syafiq Irsyad",
  authorShort: "Yazid",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
} as const;

export function absoluteUrl(path = "/") {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

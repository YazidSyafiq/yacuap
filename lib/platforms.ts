/** Platform media sosial yang bisa dipilih di Akun Saya, beserta nama tampilnya di footer. Dipakai di server dan klien. */
export const PLATFORMS = [
  { key: "instagram", label: "Instagram", urlHint: "https://www.instagram.com/namaakun" },
  { key: "tiktok", label: "TikTok", urlHint: "https://www.tiktok.com/@namaakun" },
  { key: "youtube", label: "YouTube", urlHint: "https://www.youtube.com/@namaakun" },
  { key: "x", label: "X", urlHint: "https://x.com/namaakun" },
  { key: "threads", label: "Threads", urlHint: "https://www.threads.net/@namaakun" },
  { key: "facebook", label: "Facebook", urlHint: "https://www.facebook.com/namaakun" },
  { key: "spotify", label: "Spotify", urlHint: "https://open.spotify.com/user/namaakun" },
  { key: "lainnya", label: "Lainnya", urlHint: "https://..." },
] as const;

export type PlatformKey = (typeof PLATFORMS)[number]["key"];

export type SocialItem = { platform: PlatformKey; label: string; username: string; url: string };

export function platformLabel(key: string) {
  return PLATFORMS.find((platform) => platform.key === key)?.label ?? "Lainnya";
}

import type { ComponentType } from "react";
import { CommentIcon, DashboardIcon, MusicIcon, PenIcon, TagIcon } from "./icons";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Hanya aktif kalau alamatnya persis sama (untuk Dashboard). */
  exact?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

/** Menu sidebar admin, berkelompok. */
export const NAV: NavGroup[] = [
  { label: "Ringkasan", items: [{ label: "Dashboard", href: "/admin", icon: DashboardIcon, exact: true }] },
  {
    label: "Tulisan",
    items: [
      { label: "Tulisan", href: "/admin/tulisan", icon: PenIcon },
      { label: "Tag", href: "/admin/tag", icon: TagIcon },
      { label: "Komentar", href: "/admin/komentar", icon: CommentIcon },
    ],
  },
  { label: "Musik", items: [{ label: "Playlist", href: "/admin/playlist", icon: MusicIcon }] },
];

const TITLES: Record<string, string> = { "/admin/akun": "Akun Saya" };

/** Judul di bilah atas, diambil dari menu yang alamatnya paling cocok dengan halaman sekarang. */
export function pageTitle(pathname: string) {
  const items = NAV.flatMap((group) => group.items);
  const match = items
    .filter((item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return match.label;
  const extra = Object.keys(TITLES).find((href) => pathname === href || pathname.startsWith(`${href}/`));
  return extra ? TITLES[extra] : "Admin";
}

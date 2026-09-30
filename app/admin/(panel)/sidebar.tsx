"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoOnDark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/cn";
import { signOut } from "../actions";

const items = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/tulisan", label: "Tulisan" },
  { href: "/admin/playlist", label: "Playlist" },
  { href: "/admin/komentar", label: "Komentar" },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex shrink-0 flex-col gap-2 bg-ink px-5 py-7 text-bg md:min-h-screen md:w-56">
      <div className="px-3 pb-6">
        <LogoOnDark height={30} />
      </div>
      <nav aria-label="Admin" className="flex flex-row flex-wrap gap-1 md:flex-col">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-[10px] px-3 py-3 font-ui text-[15px]",
                active ? "bg-ink-soft font-semibold text-bg" : "font-medium text-line hover:text-bg",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="md:flex-1" />
      <p className="truncate px-3 font-ui text-xs text-border-strong" title={email}>
        {email}
      </p>
      <div className="flex items-center justify-between gap-2">
        <form action={signOut}>
          <button type="submit" className="px-3 py-3 font-ui text-sm text-line hover:text-bg">
            Keluar
          </button>
        </form>
        <ThemeToggle className="text-line hover:text-bg" />
      </div>
    </aside>
  );
}

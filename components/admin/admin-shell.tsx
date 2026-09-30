"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthorPhoto } from "@/components/site/author-photo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/cn";
import { site } from "@/lib/site";
import { ExternalIcon, LogoutIcon, MoreIcon, PanelIcon, UserIcon } from "./icons";
import { NAV, pageTitle } from "./nav";

const MENU_WIDTH = 224;
const MENU_GAP = 12;

/**
 * Menu pengguna di kaki sidebar: foto, nama, lalu menu kecil berisi Akun saya, Lihat situs, dan Keluar.
 * Seperti di Portal Parerejo, menunya muncul di samping kanan tombolnya dengan sisi bawah sejajar.
 * Di HP juga ke samping; kalau tidak muat, digeser ke kiri secukupnya supaya tetap di dalam layar.
 * Tertutup kalau diklik di luar, ditekan Escape, atau ukuran layar berubah.
 */
function UserMenu({
  email,
  collapsed,
  signOut,
  onNavigate,
}: {
  email: string;
  collapsed: boolean;
  signOut: () => Promise<void>;
  onNavigate: () => void;
}) {
  // posisi menu dihitung dari letak tombolnya saat dibuka; null berarti tertutup
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const open = position !== null;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setPosition(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPosition(null);
    };
    const onResize = () => setPosition(null);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (open) {
      setPosition(null);
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(box.right + MENU_GAP, window.innerWidth - MENU_WIDTH - 8));
    setPosition({ left, bottom: Math.max(8, window.innerHeight - box.bottom) });
  };

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-bg";
  const close = () => {
    setPosition(null);
    onNavigate();
  };

  return (
    <div ref={ref}>
      {position ? (
        <div
          role="menu"
          style={{ left: position.left, bottom: position.bottom, width: MENU_WIDTH }}
          className="fixed z-[60] rounded-xl border border-line bg-surface p-1.5 shadow-xl dark:border-border-strong dark:shadow-[0_0_40px_-8px_rgba(255,255,255,0.18)]"
        >
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <AuthorPhoto size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{site.author}</p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link href="/admin/akun" role="menuitem" onClick={close} className={item}>
            <UserIcon className="size-4 text-muted" />
            Akun Saya
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" role="menuitem" onClick={close} className={item}>
            <ExternalIcon className="size-4 text-muted" />
            Lihat situs
          </a>
          <div className="my-1 h-px bg-line" />
          <form action={signOut}>
            <button type="submit" role="menuitem" className={cn(item, "text-danger")}>
              <LogoutIcon className="size-4" />
              Keluar
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu akun"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-bg",
          open && "bg-bg",
          collapsed && "justify-center",
        )}
      >
        <AuthorPhoto size={36} />
        {collapsed ? null : (
          <>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-sm font-semibold">{site.author}</span>
              <span className="truncate text-[11px] text-muted">Yang nulis</span>
            </span>
            <MoreIcon className="size-4 shrink-0 text-muted" />
          </>
        )}
      </button>
    </div>
  );
}

function SidebarBody({
  email,
  collapsed,
  signOut,
  onNavigate,
}: {
  email: string;
  collapsed: boolean;
  signOut: () => Promise<void>;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        aria-label="Dashboard"
        onClick={onNavigate}
        className={cn("flex h-14 shrink-0 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}
      >
        {/* kotak logo yang sama dengan header situs */}
        <span className="flex h-9 w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-ink">
          <Image src="/logo/yacuap-mark-putih.png" alt="" width={24} height={22} className="theme-invert h-[22px] w-auto" />
        </span>
        {collapsed ? null : (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-lg font-semibold">{site.name}</span>
            <span className="truncate text-[11px] text-muted">Ruang nulis</span>
          </span>
        )}
      </Link>

      <nav aria-label="Admin" className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-3">
        {NAV.map((group, index) => (
          <div key={group.label} className="flex flex-col gap-1">
            {collapsed ? (
              // saat diciutkan nama kelompok tidak muat, jadi diganti garis pemisah
              index > 0 ? <div className="mx-2 mb-1 h-px bg-line" /> : null
            ) : (
              <p className="px-2.5 pb-1 text-xs font-medium text-muted">{group.label}</p>
            )}
            {group.items.map(({ label, href, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[15px]",
                    active ? "bg-bg font-semibold text-ink" : "text-ink-soft hover:bg-bg",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className="size-[18px] shrink-0" />
                  {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-2.5">
        <UserMenu email={email} collapsed={collapsed} signOut={signOut} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/**
 * Kerangka admin, diadaptasi dari Portal Parerejo:
 * sidebar terang dengan menu berkelompok yang bisa diciutkan jadi ikon (di HP jadi laci dari kiri),
 * dan bilah atas berisi tombol sidebar, judul halaman, serta tombol tema.
 */
export function AdminShell({
  email,
  signOut,
  children,
}: {
  email: string;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // Tombol di bilah atas: di layar lebar menciutkan sidebar, di HP membuka laci.
  const toggle = () => {
    if (window.matchMedia("(min-width: 768px)").matches) setCollapsed((value) => !value);
    else setDrawer((value) => !value);
  };

  return (
    <div className="flex min-h-svh w-full flex-1 font-ui">
      <aside
        className={cn(
          // z-40: sidebar yang menempel (sticky) membentuk lapisan sendiri, jadi menu akun di dalamnya
          // ikut lapisan ini; tanpa z-index, isian di halaman (yang juga berlapis) bisa menutupi menunya.
          "sticky top-0 z-40 hidden h-svh shrink-0 border-r border-line bg-surface transition-[width] duration-200 md:block",
          collapsed ? "w-[60px]" : "w-64",
        )}
      >
        <SidebarBody email={email} collapsed={collapsed} signOut={signOut} onNavigate={() => undefined} />
      </aside>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-line bg-surface shadow-xl">
            <SidebarBody email={email} collapsed={false} signOut={signOut} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              onClick={toggle}
              aria-label="Buka atau ciutkan menu"
              title="Buka atau ciutkan menu"
              className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
            >
              <PanelIcon className="size-[18px]" />
            </button>
            <p className="min-w-0 truncate text-lg font-semibold tracking-tight">{pageTitle(pathname)}</p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-7 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}

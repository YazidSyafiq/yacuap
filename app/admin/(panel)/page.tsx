import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, CommentIcon, MusicIcon, PenIcon, QuoteIcon, TagIcon } from "@/components/admin/icons";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard" };

const ZONE = "Asia/Jakarta";

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: ZONE }).format(now));
  if (hour < 4) return "Masih melek";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

type RecentPost = { id: string; title: string; slug: string; status: "draft" | "published"; updated_at: string };

/** Ringkasan isi situs: sapaan, jumlah tiap jenis isi, tulisan yang terakhir diubah, dan jalan pintas. */
export default async function AdminHomePage() {
  const { supabase } = await requireAdmin();
  const count = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });

  const [published, drafts, tracks, quips, tags, recent] = await Promise.all([
    count("posts").eq("status", "published"),
    count("posts").eq("status", "draft"),
    count("playlist_tracks"),
    count("celotehan"),
    count("tags"),
    supabase.from("posts").select("id, title, slug, status, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);
  const posts = (recent.data ?? []) as RecentPost[];

  const now = new Date();
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONE }).format(now);
  const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: ZONE });

  const stats = [
    { label: "Tulisan terbit", value: published.count ?? 0, note: `${drafts.count ?? 0} masih draf`, icon: PenIcon, href: "/admin/tulisan" },
    { label: "Lagu di playlist", value: tracks.count ?? 0, note: "Satu playlist", icon: MusicIcon, href: "/admin/playlist" },
    { label: "Ocehan", value: quips.count ?? 0, note: "Tampil di beranda", icon: QuoteIcon, href: "/#ocehan" },
    { label: "Tag", value: tags.count ?? 0, note: "Bisa ditambah kapan aja", icon: TagIcon, href: "/admin/tag" },
  ];

  const shortcuts = [
    { label: "Tambah lagu ke playlist", href: "/admin/playlist", icon: MusicIcon },
    { label: "Tambah tag baru", href: "/admin/tag", icon: TagIcon },
    { label: "Lihat komentar", href: "/admin/komentar", icon: CommentIcon },
  ];

  return (
    <div className="flex flex-col gap-7">
      <AdminPageHeader title={`${greeting(now)}, ${site.authorShort}`} note={today} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, href }) => (
          <Link key={label} href={href} className="group">
            <Card className="flex h-full flex-col gap-2 p-5 group-hover:border-border-strong">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted">{label}</p>
                <Icon className="size-[18px] shrink-0 text-muted" />
              </div>
              <p className="font-display text-[2rem] font-semibold leading-none tabular-nums">{value}</p>
              <p className="text-xs text-muted">{note}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="flex items-center gap-2.5 text-base font-semibold">
              <PenIcon className="size-[18px] text-muted" />
              Tulisan terakhir diubah
            </h2>
            <Link href="/admin/tulisan" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
              Lihat semua
              <ArrowIcon className="size-4" />
            </Link>
          </div>
          {posts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">Belum ada tulisan.</p>
          ) : (
            <ul className="flex flex-col px-5 py-1">
              {posts.map((post) => (
                <li key={post.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{post.title || "Tanpa judul"}</span>
                  <span
                    className={
                      post.status === "published"
                        ? "shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-semibold text-surface"
                        : "shrink-0 rounded-full border border-border-strong px-2.5 py-0.5 text-[11px] font-semibold text-muted"
                    }
                  >
                    {post.status === "published" ? "Terbit" : "Draf"}
                  </span>
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted">
                    {shortDate.format(new Date(post.updated_at))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold">Mau ngapain?</h2>
          </div>
          <ul className="flex flex-col px-5 py-1">
            {shortcuts.map(({ label, href, icon: Icon }) => (
              <li key={label} className="border-b border-line last:border-b-0">
                <Link href={href} className="flex items-center gap-3 py-3 text-[15px] font-medium hover:text-muted">
                  <Icon className="size-[18px] shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">{label}</span>
                  <ArrowIcon className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

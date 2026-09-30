import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "./sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Yacuap" },
  robots: { index: false, follow: false },
};

// Area admin selalu dirender per request: bergantung pada sesi, tidak boleh di-prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col font-ui md:flex-row">
      <AdminSidebar email={user.email ?? ""} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-10">{children}</main>
    </div>
  );
}

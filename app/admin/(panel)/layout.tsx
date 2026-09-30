import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Yacuap" },
  robots: { index: false, follow: false },
};

// Area admin selalu dirender per request: bergantung pada sesi, tidak boleh di-prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();

  return (
    <AdminShell email={user.email ?? ""} signOut={signOut}>
      {children}
    </AdminShell>
  );
}

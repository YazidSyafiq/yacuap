import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Komentar" };

export default function AdminKomentarPage() {
  return <AdminPageHeader title="Komentar" note="Belum ada, nih. Komentar pembaca nanti muncul dan diatur dari sini." />;
}

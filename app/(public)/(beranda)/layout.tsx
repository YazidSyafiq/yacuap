import { SiteFooter } from "@/components/site/footer";

/** Beranda: satu-satunya halaman yang memakai footer. */
export default function BerandaLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

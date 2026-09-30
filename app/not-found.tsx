import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-24 text-center">
      <Logo height={44} />
      <h1 className="font-display text-4xl font-medium">Wah, nyasar nih.</h1>
      <p className="max-w-md text-muted">Halamannya nggak ada. Bisa jadi salah ketik, bisa jadi emang belum ditulis.</p>
      <Link href="/" className={buttonClass("primary")}>
        Balik ke depan, yuk
      </Link>
    </main>
  );
}

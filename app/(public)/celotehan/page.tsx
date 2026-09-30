import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { getCelotehan } from "@/lib/celotehan";

export const metadata: Metadata = {
  title: "Celotehan",
  description: "Yang pendek-pendek. Sebaris, kadang nggak sampai.",
};

export const revalidate = 300;

/** Semua celotehan: tulisan sebaris, yang juga muncul di balon kerumunan di beranda. */
export default async function QuipsPage() {
  const celotehan = await getCelotehan(200);

  return (
    <Container className="flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-4 border-b-2 border-ink pb-8">
        <h1 className="font-display text-[2.5rem] font-medium leading-tight sm:text-5xl">Celotehan</h1>
        <p className="max-w-[640px] text-xl text-muted">
          Yang pendek-pendek. Sebaris, kadang nggak sampai. Nggak usah dipikirin serius.
        </p>
      </header>
      <ul className="grid gap-x-10 sm:grid-cols-2 xl:grid-cols-3">
        {celotehan.map((text, index) => (
          <li key={`${index}-${text}`} className="border-b border-line py-5 font-display text-2xl italic leading-snug">
            {text}
          </li>
        ))}
      </ul>
    </Container>
  );
}

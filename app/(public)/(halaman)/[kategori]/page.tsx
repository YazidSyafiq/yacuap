import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryChip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { CrowdCanvas } from "@/components/ui/crowd-canvas";
import { categories, CATEGORY_SLUGS, isCategory } from "@/lib/categories";
import { getCelotehan } from "@/lib/celotehan";

export const dynamicParams = false;
export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((kategori) => ({ kategori }));
}

export async function generateMetadata({ params }: PageProps<"/[kategori]">): Promise<Metadata> {
  const { kategori } = await params;
  if (!isCategory(kategori)) return {};
  return { title: categories[kategori].label, description: categories[kategori].blurb };
}

export default async function CategoryPage({ params }: PageProps<"/[kategori]">) {
  const { kategori } = await params;
  if (!isCategory(kategori)) notFound();
  const category = categories[kategori];
  const celotehan = await getCelotehan();

  return (
    <>
      <section className="overflow-hidden border-b-2 border-ink">
        <Container className="flex flex-col gap-4 pt-10">
          <CategoryChip category={kategori} className="self-start" />
          <h1 className="font-display text-[2.5rem] font-medium leading-tight sm:text-5xl">{category.label}</h1>
          <p className="max-w-[640px] text-xl text-muted">{category.blurb}</p>
        </Container>
        {/* kerumunan yang sama dengan beranda, lebih kecil, balonnya berisi celotehan */}
        <div className="h-[200px] sm:h-[260px] lg:h-[320px] 2xl:h-[380px]">
          <CrowdCanvas src="/hero/kerumunan.png" srcDark="/hero/kerumunan-gelap.png" phrases={celotehan} bubbleChance={0.1} density={0.8} sizeByWidth={0.1} maxHeightFraction={0.78} />
        </div>
      </section>
      <Container className="py-10">
        <p className="font-display text-2xl italic">Masih kosong, nih. Bentar lagi diisi.</p>
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { ReadColumn } from "@/components/ui/container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tentang",
  description: site.description,
};

export default function AboutPage() {
  return (
    <ReadColumn className="flex flex-col gap-8 py-12">
      <Image
        src="/logo/yacuap-lockup-vertikal.png"
        alt={site.name}
        width={204}
        height={221}
        className="self-start"
      />
      <h1 className="font-display text-[2.5rem] font-medium leading-tight">Ini apa, sih?</h1>
      <div className="flex flex-col gap-6 text-[1.3125rem] leading-[1.7]">
        <p>
          {site.name} itu singkatan dari Yazid cuap-cuap. Isinya apa aja yang lewat di kepala: cerita yang
          panjang-panjang, celotehan yang cuma sebaris, sampai lagu yang lagi sering diputar.
        </p>
        <p>Nggak ada tema khusus, nggak ada jadwal. Kalau lagi pengen nulis, ya ditulis.</p>
        <p>Boleh didengerin, boleh dicuekin.</p>
      </div>
      <p className="border-t border-line pt-6 font-ui text-[13px] leading-relaxed text-muted">
        Orang-orang di beranda digambar dari{" "}
        <a href="https://www.openpeeps.com/" className="underline hover:text-ink">
          Open Peeps
        </a>{" "}
        karya Pablo Stanley.
      </p>
    </ReadColumn>
  );
}

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="flex flex-col gap-3 py-6 font-ui text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          {site.name}, {site.tagline}. Boleh didengerin, boleh dicuekin.
        </span>
        <nav aria-label="Kaki" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/#tulisan" className="hover:text-ink">
            Tulisan
          </Link>
          <Link href="/#ocehan" className="hover:text-ink">
            Ocehan
          </Link>
          <Link href="/#playlist" className="hover:text-ink">
            Playlist
          </Link>
          <Link href="/#oknumnya" className="hover:text-ink">
            Oknumnya
          </Link>
        </nav>
      </Container>
    </footer>
  );
}

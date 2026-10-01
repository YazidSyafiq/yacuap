import { InlineTrack } from "@/components/player/inline-track";

const CARD = /<div data-track-card[^>]*>[\s\S]*?<\/div>/g;

function unescape(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`data-${name}="([^"]*)"`));
  return match ? unescape(match[1]) : "";
}

/**
 * Isi tulisan dari editor (HTML) dengan kartu lagu yang hidup.
 * HTML-nya dipotong di tiap <div data-track-card>, potongan teks dirender apa adanya,
 * dan tiap kartu diganti komponen InlineTrack yang tersambung ke pemutar situs.
 * Tiap potongan teks memakai kelas .tulisan supaya jarak dan gaya paragrafnya tetap sama.
 */
export function StoryBody({ html, className }: { html: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of html.matchAll(CARD)) {
    const start = match.index ?? 0;
    if (start > last) parts.push(<div key={key++} className="tulisan" dangerouslySetInnerHTML={{ __html: html.slice(last, start) }} />);
    const tag = match[0];
    const youtubeId = attr(tag, "youtube-id");
    if (youtubeId) {
      parts.push(
        <InlineTrack
          key={key++}
          track={{ id: attr(tag, "id") || youtubeId, youtubeId, title: attr(tag, "title"), artist: attr(tag, "artist"), artwork: attr(tag, "artwork") || null }}
        />,
      );
    }
    last = start + tag.length;
  }
  if (last < html.length) parts.push(<div key={key++} className="tulisan" dangerouslySetInnerHTML={{ __html: html.slice(last) }} />);

  return <div className={className}>{parts}</div>;
}

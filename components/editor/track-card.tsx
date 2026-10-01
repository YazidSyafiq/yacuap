"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { InlineTrack } from "@/components/player/inline-track";

export type TrackCardAttrs = { id: string; youtubeId: string; title: string; artist: string; artwork: string | null };

/** Tampilan kartu lagu di dalam editor: sama seperti di halaman baca, tombolnya tidak aktif. */
function TrackCardView({ node, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as TrackCardAttrs;
  return (
    <NodeViewWrapper data-drag-handle className={selected ? "rounded-2xl outline outline-2 outline-offset-2 outline-ink" : undefined}>
      <InlineTrack track={{ id: attrs.id, youtubeId: attrs.youtubeId, title: attrs.title, artist: attrs.artist, artwork: attrs.artwork }} interactive={false} />
    </NodeViewWrapper>
  );
}

/**
 * Node Tiptap "kartu lagu". Disimpan di HTML sebagai <div data-track-card ...> beserta data lagunya,
 * lalu di halaman baca diganti komponen InlineTrack yang tombolnya berfungsi (lihat components/site/story-body.tsx).
 */
export const TrackCard = Node.create({
  name: "trackCard",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: null, parseHTML: (el) => el.getAttribute("data-id") },
      youtubeId: { default: null, parseHTML: (el) => el.getAttribute("data-youtube-id") },
      title: { default: "", parseHTML: (el) => el.getAttribute("data-title") ?? "" },
      artist: { default: "", parseHTML: (el) => el.getAttribute("data-artist") ?? "" },
      artwork: { default: null, parseHTML: (el) => el.getAttribute("data-artwork") },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-track-card]" }];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as TrackCardAttrs;
    return [
      "div",
      mergeAttributes({
        "data-track-card": "",
        "data-id": attrs.id,
        "data-youtube-id": attrs.youtubeId,
        "data-title": attrs.title,
        "data-artist": attrs.artist,
        "data-artwork": attrs.artwork ?? "",
        class: "track-card-static",
      }),
      // cadangan kalau JavaScript tidak jalan: judul dan tautan ke YouTube
      ["a", { href: `https://www.youtube.com/watch?v=${attrs.youtubeId}`, target: "_blank", rel: "noopener noreferrer" }, `${attrs.title}${attrs.artist ? ` · ${attrs.artist}` : ""}`],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TrackCardView);
  },
});

import type { Metadata } from "next";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/playlist";
import { moveTrackDown, moveTrackUp, removeTrack, updateTrack } from "./actions";
import { AddTrackForm, PlaylistForm } from "./forms";

export const metadata: Metadata = { title: "Playlist" };

type Row = {
  id: string;
  name: string;
  description: string;
  playlist_tracks: {
    note: string;
    position: number;
    tracks: { id: string; title: string; artist: string; youtube_id: string; artwork_path: string | null } | null;
  }[];
};

const SELECT =
  "id, name, description, playlist_tracks(note, position, tracks(id, title, artist, youtube_id, artwork_path))";

const arrow =
  "flex size-10 items-center justify-center rounded-full border border-border-strong text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-35";

/**
 * Situs ini hanya punya satu playlist, jadi halaman ini langsung mengatur isinya.
 * Kalau playlistnya belum ada, dibuat saat halaman ini pertama kali dibuka.
 */
export default async function AdminPlaylistPage() {
  const { supabase } = await requireAdmin();

  const find = () =>
    supabase
      .from("playlists")
      .select(SELECT)
      .eq("status", "published")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

  let { data } = await find();
  if (!data) {
    await supabase
      .from("playlists")
      .insert({ name: "Lagi sering muter ini", slug: "utama", status: "published", is_featured: true });
    ({ data } = await find());
  }
  if (!data) {
    return <p className="text-sm text-muted">Playlistnya gagal disiapkan. Coba muat ulang halaman ini.</p>;
  }

  const playlist = data as unknown as Row;
  const items = [...playlist.playlist_tracks].sort((a, b) => a.position - b.position);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[2.125rem] font-medium">Playlist</h1>
        <p className="text-sm text-muted">
          Tempel tautan YouTube untuk menambah lagu. Judul, artis, dan sampulnya diambil otomatis, dan perubahan
          langsung tampil di situs.
        </p>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-medium">Tambah lagu</h2>
        <AddTrackForm playlistId={playlist.id} />
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-medium">Isi playlist ({items.length} lagu)</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Belum ada lagu. Tempel tautan YouTube di atas.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {items.map((item, i) => {
              const track = item.tracks;
              if (!track) return null;
              const artwork = coverUrl(track.artwork_path);
              return (
                <li key={track.id}>
                  <Card className="flex flex-col gap-4 p-5">
                    <form action={updateTrack} className="flex flex-col gap-4">
                      <input type="hidden" name="playlistId" value={playlist.id} />
                      <input type="hidden" name="trackId" value={track.id} />
                      <div className="flex items-start gap-4">
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--cover)">
                          {artwork ? (
                            <Image src={artwork} alt="" fill sizes="64px" unoptimized className="mono-img object-cover" />
                          ) : null}
                        </span>
                        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`title-${track.id}`}>Judul</Label>
                            <Input id={`title-${track.id}`} name="title" required defaultValue={track.title} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`artist-${track.id}`}>Artis</Label>
                            <Input id={`artist-${track.id}`} name="artist" defaultValue={track.artist} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`note-${track.id}`}>Kenapa lagu ini masuk?</Label>
                        <Textarea id={`note-${track.id}`} name="note" rows={2} maxLength={400} defaultValue={item.note} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SubmitButton size="sm">Simpan</SubmitButton>
                        <SubmitButton size="sm" variant="secondary" formAction={removeTrack} formNoValidate>
                          Keluarkan
                        </SubmitButton>
                        <span className="flex-1" />
                        <button
                          type="submit"
                          formAction={moveTrackUp}
                          formNoValidate
                          disabled={i === 0}
                          aria-label={`Naikkan ${track.title}`}
                          className={arrow}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                            <path d="M12 19V5M6 11l6-6 6 6" />
                          </svg>
                        </button>
                        <button
                          type="submit"
                          formAction={moveTrackDown}
                          formNoValidate
                          disabled={i === items.length - 1}
                          aria-label={`Turunkan ${track.title}`}
                          className={arrow}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
                            <path d="M12 5v14M6 13l6 6 6-6" />
                          </svg>
                        </button>
                      </div>
                    </form>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Card className="flex flex-col gap-5 p-6">
        <h2 className="font-display text-xl font-medium">Nama dan keterangan</h2>
        <PlaylistForm playlist={{ id: playlist.id, name: playlist.name, description: playlist.description }} />
      </Card>
    </div>
  );
}

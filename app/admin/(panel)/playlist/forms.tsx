"use client";

import { useActionState } from "react";
import { Input, Label, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { addTrack, updatePlaylist, type FormState } from "./actions";

function Feedback({ state }: { state: FormState }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p role="status" className={state.error ? "text-sm font-semibold text-ink" : "text-sm text-muted"}>
      {state.error ?? state.ok}
    </p>
  );
}

export function PlaylistForm({ playlist }: { playlist: { id: string; name: string; description: string } }) {
  const [state, action] = useActionState(updatePlaylist, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={playlist.id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nama playlist</Label>
        <Input id="name" name="name" required maxLength={80} defaultValue={playlist.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Keterangan singkat</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={280}
          defaultValue={playlist.description}
          placeholder="Boleh dikosongin."
        />
      </div>
      <Feedback state={state} />
      <SubmitButton>Simpan</SubmitButton>
    </form>
  );
}

export function AddTrackForm({ playlistId }: { playlistId: string }) {
  const [state, action] = useActionState(addTrack, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="playlistId" value={playlistId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="url">Tautan YouTube lagunya</Label>
        <Input id="url" name="url" required inputMode="url" placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Kenapa lagu ini masuk?</Label>
        <Textarea id="note" name="note" rows={2} maxLength={400} placeholder="Boleh dikosongin, bisa diisi belakangan." />
      </div>
      <Feedback state={state} />
      <SubmitButton>Tambah lagu</SubmitButton>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { TrackRow } from "@/components/track-row";
import type { AlbumRecord, TrackRecord } from "@/lib/types";

export function SearchClient({
  tracks,
  albums,
}: {
  tracks: TrackRecord[];
  albums: AlbumRecord[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        (track.albumTitle || "").toLowerCase().includes(q),
    );
  }, [query, tracks]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black md:text-4xl">Buscar</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Música, artista ou álbum"
          className="mt-4 w-full rounded-full border border-line bg-surface px-6 py-4 text-lg"
        />
      </div>
      <div className="rounded-[1.8rem] border border-line bg-surface p-2">
        {filtered.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            queue={filtered}
            albums={albums.map((album) => ({ id: album.id, title: album.title }))}
          />
        ))}
        {!filtered.length ? (
          <p className="p-8 text-center text-muted">Nada encontrado na sua biblioteca.</p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { TrackRow } from "@/components/track-row";
import { listOfflineTracks } from "@/lib/offline";
import type { TrackRecord } from "@/lib/types";

export default function OfflinePage() {
  const [tracks, setTracks] = useState<TrackRecord[]>([]);

  useEffect(() => {
    void listOfflineTracks().then(setTracks);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-4xl font-black">Offline</h1>
        <p className="text-muted">
          Faixas salvas neste aparelho. Marque o ícone de download em qualquer
          música para ouvir sem internet.
        </p>
      </div>
      <div className="rounded-[1.8rem] border border-line bg-surface p-2">
        {tracks.map((track) => (
          <TrackRow key={track.id} track={track} queue={tracks} />
        ))}
        {!tracks.length ? (
          <p className="p-8 text-center text-muted">
            Nenhuma faixa em cache ainda.
          </p>
        ) : null}
      </div>
    </div>
  );
}

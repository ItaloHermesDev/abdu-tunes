"use client";

import { Download, Heart, MoreHorizontal, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player-provider";
import { cacheTrackAudio, isTrackCached, uncacheTrackAudio } from "@/lib/offline";
import { formatDuration } from "@/lib/utils";
import type { TrackRecord } from "@/lib/types";

export function TrackRow({
  track,
  queue,
  albums,
}: {
  track: TrackRecord;
  queue: TrackRecord[];
  albums?: Array<{ id: string; title: string }>;
}) {
  const player = usePlayer();
  const router = useRouter();
  const active = player.current?.id === track.id;
  const [cached, setCached] = useState(false);

  useEffect(() => {
    void isTrackCached(track.id).then(setCached);
  }, [track.id]);

  async function favorite() {
    await fetch(`/api/tracks/${track.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !track.isFavorite }),
    });
    if (active) player.updateCurrent({ isFavorite: !track.isFavorite });
    router.refresh();
  }

  async function moveTo(albumId: string | null) {
    await fetch(`/api/tracks/${track.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ albumId }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Remover “${track.title}”?`)) return;
    await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl px-2 py-2 hover:bg-surface-2 sm:gap-3 sm:px-3 ${
        active ? "bg-surface-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => player.playTrack(track, queue)}
        className="relative h-12 w-12 overflow-hidden rounded-xl bg-abdu-gradient"
        aria-label={`Tocar ${track.title}`}
      >
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt="" fill className="object-cover" unoptimized sizes="48px" />
        ) : null}
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-0 hover:opacity-100">
          <Play size={16} />
        </span>
      </button>
      <div className="min-w-0">
        <p className={`truncate font-bold ${active ? "text-abdu-gradient" : ""}`}>
          {track.title}
        </p>
        <p className="truncate text-sm text-muted">
          {track.artist}
          {track.albumTitle ? ` · ${track.albumTitle}` : " · Solta"}
        </p>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted">
        <span className="hidden w-12 text-right sm:inline">
          {formatDuration(track.duration)}
        </span>
        <button
          type="button"
          onClick={async () => {
            if (cached) {
              await uncacheTrackAudio(track.id);
              setCached(false);
              return;
            }
            await cacheTrackAudio(track);
            setCached(true);
          }}
          className="rounded-full p-2 hover:text-coral"
          aria-label={cached ? "Remover do offline" : "Salvar offline"}
        >
          <Download size={16} className={cached ? "text-coral" : ""} />
        </button>
        <button
          type="button"
          onClick={favorite}
          className="rounded-full p-2 hover:text-coral"
          aria-label="Favoritar"
        >
          <Heart
            size={16}
            className={track.isFavorite ? "fill-coral text-coral" : ""}
          />
        </button>
        <details className="relative">
          <summary className="list-none rounded-full p-2 hover:bg-surface">
            <MoreHorizontal size={16} />
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-2xl border border-line bg-background p-1 shadow-xl">
            {albums?.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() => moveTo(album.id)}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                Mover para {album.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => moveTo(null)}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2"
            >
              Deixar solta
            </button>
            <button
              type="button"
              onClick={remove}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-coral hover:bg-surface-2"
            >
              Remover
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

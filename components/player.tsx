"use client";

import {
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import { usePlayer } from "@/components/player-provider";
import { SoundWave } from "@/components/sound-wave";
import { formatDuration } from "@/lib/utils";

export function PlayerBar() {
  const {
    current,
    playing,
    progress,
    duration,
    volume,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    updateCurrent,
  } = usePlayer();

  const percent = duration ? (progress / duration) * 100 : 0;

  async function favorite() {
    if (!current) return;
    const response = await fetch(`/api/tracks/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current.isFavorite }),
    });
    if (response.ok) {
      updateCurrent({ isFavorite: !current.isFavorite });
    }
  }

  return (
    <div className="border-t border-line glass-panel">
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={progress}
        disabled={!current}
        onChange={(event) => seek(Number(event.target.value))}
        className="abdu-range block h-1 w-full md:hidden"
        style={{ ["--progress" as string]: `${percent}%` }}
        aria-label="Progresso da faixa"
      />

      <div className="flex items-center gap-3 px-3 py-2 md:hidden">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-abdu-gradient">
          {current?.coverUrl ? (
            <Image
              src={current.coverUrl}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="48px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white">
              ♪
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">
            {current?.title ?? "Selecione uma faixa"}
          </p>
          <p className="truncate text-xs text-muted">
            {current?.artist ?? "Abdu Tunes"}
          </p>
        </div>
        <button
          type="button"
          disabled={!current}
          onClick={favorite}
          className="rounded-full p-2 text-muted disabled:opacity-40"
          aria-label="Favoritar"
        >
          <Heart
            className={current?.isFavorite ? "fill-coral text-coral" : ""}
            size={18}
          />
        </button>
        <button
          type="button"
          onClick={toggle}
          disabled={!current}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-abdu-gradient text-white glow-abdu disabled:opacity-40"
          aria-label={playing ? "Pausar" : "Tocar"}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full p-2 text-muted"
          aria-label="Próxima"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className="mx-auto hidden max-w-7xl items-center gap-4 px-6 py-3 md:grid md:grid-cols-[1.2fr_2fr_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-abdu-gradient">
            {current?.coverUrl ? (
              <Image
                src={current.coverUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                sizes="56px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                ♪
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-extrabold">
              {current?.title ?? "Selecione uma faixa"}
            </p>
            <p className="truncate text-sm text-muted">
              {current?.artist ?? "Abdu Tunes"}
            </p>
          </div>
          <button
            type="button"
            disabled={!current}
            onClick={favorite}
            className="rounded-full p-2 text-muted hover:text-coral"
            aria-label="Favoritar"
          >
            <Heart
              className={current?.isFavorite ? "fill-coral text-coral" : ""}
              size={18}
            />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              className="rounded-full p-2 text-muted hover:text-foreground"
              aria-label="Anterior"
            >
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              onClick={toggle}
              disabled={!current}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-abdu-gradient text-white glow-abdu disabled:opacity-40"
              aria-label={playing ? "Pausar" : "Tocar"}
            >
              {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full p-2 text-muted hover:text-foreground"
              aria-label="Próxima"
            >
              <SkipForward size={18} />
            </button>
            <SoundWave active={playing} />
          </div>
          <div className="flex w-full items-center gap-3 text-xs text-muted">
            <span className="w-10 text-right">{formatDuration(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              disabled={!current}
              onChange={(event) => seek(Number(event.target.value))}
              className="abdu-range w-full"
              style={{ ["--progress" as string]: `${percent}%` }}
            />
            <span className="w-10">
              {formatDuration(duration || current?.duration || 0)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Volume2 size={16} className="text-muted" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="abdu-range w-28"
            style={{ ["--progress" as string]: `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

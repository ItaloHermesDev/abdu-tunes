"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PlayerTrack } from "@/lib/types";
import { getOfflineAudioUrl } from "@/lib/offline";

type PlayerContextValue = {
  queue: PlayerTrack[];
  index: number;
  current: PlayerTrack | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  updateCurrent: (patch: Partial<PlayerTrack>) => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);

  const current = queue[index] ?? null;

  const playTrack = useCallback((track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
    const list = nextQueue && nextQueue.length ? nextQueue : [track];
    const nextIndex = Math.max(
      0,
      list.findIndex((item) => item.id === track.id),
    );
    setQueue(list);
    setIndex(nextIndex);
    setPlaying(true);
    void (async () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = (await getOfflineAudioUrl(track.id)) || track.streamUrl;
      void audio.play();
    })();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }, [current, playing]);

  const next = useCallback(() => {
    if (!queue.length) return;
    const nextIndex = (index + 1) % queue.length;
    setIndex(nextIndex);
    setPlaying(true);
    const audio = audioRef.current;
    if (audio) {
      void getOfflineAudioUrl(queue[nextIndex].id).then((url) => {
        audio.src = url || queue[nextIndex].streamUrl;
        void audio.play();
      });
    }
  }, [index, queue]);

  const prev = useCallback(() => {
    if (!queue.length) return;
    const nextIndex = (index - 1 + queue.length) % queue.length;
    setIndex(nextIndex);
    setPlaying(true);
    const audio = audioRef.current;
    if (audio) {
      void getOfflineAudioUrl(queue[nextIndex].id).then((url) => {
        audio.src = url || queue[nextIndex].streamUrl;
        void audio.play();
      });
    }
  }, [index, queue]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setProgress(time);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    if (audioRef.current) audioRef.current.volume = value;
  }, []);

  const updateCurrent = useCallback((patch: Partial<PlayerTrack>) => {
    setQueue((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }, [index]);

  const value = useMemo(
    () => ({
      queue,
      index,
      current,
      playing,
      progress,
      duration,
      volume,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      updateCurrent,
    }),
    [
      queue,
      index,
      current,
      playing,
      progress,
      duration,
      volume,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      updateCurrent,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer precisa estar dentro de PlayerProvider");
  return ctx;
}

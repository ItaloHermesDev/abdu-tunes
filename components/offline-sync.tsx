"use client";

import { useEffect } from "react";
import { listOfflineTracks, saveOfflineTracks } from "@/lib/offline";
import type { TrackRecord } from "@/lib/types";

export function OfflineSync() {
  useEffect(() => {
    async function sync() {
      if (!navigator.onLine) return;
      const response = await fetch("/api/tracks");
      if (!response.ok) return;
      const json = (await response.json()) as { tracks?: TrackRecord[] };
      if (json.tracks) await saveOfflineTracks(json.tracks);
    }
    void sync();
  }, []);
  return null;
}

export function useOfflineLibrary() {
  useEffect(() => {
    void listOfflineTracks();
  }, []);
}

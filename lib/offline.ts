"use client";

import type { TrackRecord } from "@/lib/types";

const DB_NAME = "abdu-tunes-offline";
const DB_VERSION = 1;

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("tracks")) {
        db.createObjectStore("tracks", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function req<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineTracks(tracks: TrackRecord[]) {
  const db = await openDb();
  const tx = db.transaction("tracks", "readwrite");
  for (const track of tracks) {
    tx.objectStore("tracks").put(track);
  }
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(null);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listOfflineTracks() {
  const db = await openDb();
  return req<TrackRecord[]>(db.transaction("tracks").objectStore("tracks").getAll());
}

export async function isTrackCached(id: string) {
  const db = await openDb();
  const value = await req(db.transaction("audio").objectStore("audio").get(id));
  return Boolean(value);
}

export async function cacheTrackAudio(track: TrackRecord) {
  const response = await fetch(track.streamUrl);
  if (!response.ok) throw new Error("Não foi possível baixar a faixa.");
  const blob = await response.blob();
  const db = await openDb();
  const tx = db.transaction(["audio", "tracks"], "readwrite");
  tx.objectStore("audio").put(blob, track.id);
  tx.objectStore("tracks").put(track);
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(null);
    tx.onerror = () => reject(tx.error);
  });
}

export async function uncacheTrackAudio(id: string) {
  const db = await openDb();
  await req(db.transaction("audio", "readwrite").objectStore("audio").delete(id));
}

export async function getOfflineAudioUrl(id: string) {
  const db = await openDb();
  const blob = await req<Blob | undefined>(
    db.transaction("audio").objectStore("audio").get(id),
  );
  return blob ? URL.createObjectURL(blob) : null;
}

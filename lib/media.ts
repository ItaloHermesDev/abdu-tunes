import "server-only";

import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { getEnv } from "@/lib/env";

export function resolveStorageFile(
  kind: "audio" | "covers" | "avatars",
  filename: string,
) {
  const safe = path.basename(filename);
  const full = path.resolve(
    process.cwd(),
    getEnv().storageDir,
    kind,
    safe,
  );
  const root = path.resolve(process.cwd(), getEnv().storageDir, kind);
  if (!full.startsWith(root)) return null;
  if (!existsSync(full)) return null;
  return full;
}

export function fileStat(filePath: string) {
  return statSync(filePath);
}

export function nodeStreamToWeb(filePath: string, start?: number, end?: number) {
  const stream =
    start !== undefined && end !== undefined
      ? createReadStream(filePath, { start, end })
      : createReadStream(filePath);
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}

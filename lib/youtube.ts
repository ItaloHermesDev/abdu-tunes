import "server-only";

import { spawn } from "node:child_process";
import {
  chmod,
  mkdir,
  writeFile,
  access,
  copyFile,
  open,
} from "node:fs/promises";
import { createWriteStream, existsSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getEnv } from "@/lib/env";

export type ProbeEntry = {
  id: string;
  title: string;
  url: string;
  duration: number;
  thumbnail: string | null;
  artist: string;
};

export type ProbeResult = {
  type: "video" | "playlist";
  title: string;
  thumbnail: string | null;
  entries: ProbeEntry[];
};

export type DownloadProgress = {
  phase: "probe" | "download" | "convert" | "save";
  message: string;
  current?: number;
  total?: number;
  percent?: number;
  title?: string;
};

function binariesDir() {
  return path.resolve(process.cwd(), getEnv().binDir);
}

function storageRoot() {
  return path.resolve(process.cwd(), getEnv().storageDir);
}

export function audioDir() {
  return path.join(storageRoot(), "audio");
}

export function coversDir() {
  return path.join(storageRoot(), "covers");
}

function ytDlpName() {
  return process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
}

function ytDlpDownloadUrl() {
  if (process.platform === "win32") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
  }
  if (process.platform === "darwin") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
  }
  if (process.arch === "arm64") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64";
  }
  if (process.arch === "arm") {
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l";
  }
  return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
}

async function isPythonYtDlp(filePath: string) {
  try {
    const handle = await open(filePath, "r");
    const buffer = Buffer.alloc(80);
    const { bytesRead } = await handle.read(buffer, 0, 80, 0);
    await handle.close();
    return buffer.subarray(0, bytesRead).toString("utf8").includes("python");
  } catch {
    return false;
  }
}

function ffmpegName() {
  return process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
}

async function fileOk(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadBinary(url: string, dest: string) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar ${url} (${response.status})`);
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const gzip = url.endsWith(".gz");
  if (gzip) {
    const nodeStream = Readable.fromWeb(response.body as never);
    await pipeline(nodeStream, createGunzip(), createWriteStream(dest));
  } else {
    await writeFile(dest, Buffer.from(await response.arrayBuffer()));
  }
  if (process.platform !== "win32") {
    await chmod(dest, 0o755);
  }
}

async function maybeFfmpegStatic() {
  try {
    const mod = (await import("ffmpeg-static")) as { default?: string | null };
    const candidate = mod.default;
    if (candidate && existsSync(candidate)) return candidate;
  } catch {
    return null;
  }
  return null;
}

export async function ensureTools() {
  await mkdir(binariesDir(), { recursive: true });
  await mkdir(audioDir(), { recursive: true });
  await mkdir(coversDir(), { recursive: true });

  const env = getEnv();
  const managedYtdlp = !env.ytdlpPath;
  let ytdlp = env.ytdlpPath || path.join(binariesDir(), ytDlpName());
  const stalePython =
    managedYtdlp && (await fileOk(ytdlp)) && (await isPythonYtDlp(ytdlp));
  if (!(await fileOk(ytdlp)) || stalePython) {
    await downloadBinary(ytDlpDownloadUrl(), ytdlp);
  }

  let ffmpeg =
    env.ffmpegPath ||
    (await maybeFfmpegStatic()) ||
    path.join(binariesDir(), ffmpegName());

  if (!(await fileOk(ffmpeg))) {
    const ffmpegUrl =
      process.platform === "win32"
        ? "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64.gz"
        : process.platform === "darwin"
          ? process.arch === "arm64"
            ? "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64.gz"
            : "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64.gz"
          : process.arch === "arm64"
            ? "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm64.gz"
            : "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz";
    const dest = path.join(binariesDir(), ffmpegName());
    await downloadBinary(ffmpegUrl, dest);
    ffmpeg = dest;
  }

  return { ytdlp, ffmpeg };
}

function runCommand(
  binary: string,
  args: string[],
  onOutput?: (line: string) => void,
) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(binary, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      text.split(/\r?\n/).filter(Boolean).forEach((line) => onOutput?.(line));
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      text.split(/\r?\n/).filter(Boolean).forEach((line) => onOutput?.(line));
    });
    child.on("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("python")) {
        reject(
          new Error(
            "yt-dlp precisa do binário standalone. Remova BIN_DIR/yt-dlp e importe de novo.",
          ),
        );
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const output = stderr.trim() || stdout.trim();
      if (output.includes("python3") || output.includes("python")) {
        reject(
          new Error(
            "O servidor não tem Python. O import agora baixa o yt-dlp standalone. Tente importar de novo.",
          ),
        );
        return;
      }
      reject(new Error(output || `yt-dlp encerrou com código ${code}`));
    });
  });
}

function parseJsonBlob(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Não foi possível ler os metadados do YouTube.");
  }
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function artistFrom(info: Record<string, unknown>) {
  return (
    (info.artist as string) ||
    (info.creator as string) ||
    (info.uploader as string) ||
    (info.channel as string) ||
    "Desconhecido"
  );
}

function thumbnailFrom(info: Record<string, unknown>) {
  if (typeof info.thumbnail === "string") return info.thumbnail;
  const thumbs = info.thumbnails as Array<{ url?: string }> | undefined;
  return thumbs?.at(-1)?.url || null;
}

export async function probeYouTube(
  url: string,
  playlist: boolean,
  onProgress?: (event: DownloadProgress) => void,
): Promise<ProbeResult> {
  const { ytdlp } = await ensureTools();
  onProgress?.({
    phase: "probe",
    message: playlist ? "Lendo a lista do YouTube..." : "Lendo a faixa...",
  });

  const { stdout } = await runCommand(ytdlp, [
    "-J",
    "--no-warnings",
    "--skip-download",
    playlist ? "--yes-playlist" : "--no-playlist",
    "--flat-playlist",
    url,
  ]);

  const json = parseJsonBlob(stdout);
  const type = json._type === "playlist" ? "playlist" : "video";
  const entriesRaw = (
    Array.isArray(json.entries) ? json.entries : [json]
  ) as Array<Record<string, unknown>>;

  const entries = entriesRaw
    .filter((entry) => entry && (entry.id || entry.url || entry.webpage_url))
    .map((entry) => {
      const id = String(entry.id || entry.display_id || crypto.randomUUID());
      return {
        id,
        title: String(entry.title || "Faixa sem título"),
        url:
          String(entry.webpage_url || entry.url || "") ||
          `https://www.youtube.com/watch?v=${id}`,
        duration: Number(entry.duration || 0),
        thumbnail: thumbnailFrom(entry),
        artist: artistFrom(entry),
      };
    });

  if (!entries.length) {
    throw new Error("Nenhuma faixa encontrada neste link.");
  }

  return {
    type,
    title: String(json.title || entries[0].title),
    thumbnail: thumbnailFrom(json) || entries[0].thumbnail,
    entries,
  };
}

async function saveThumbnail(id: string, thumbnailUrl: string | null) {
  if (!thumbnailUrl) return null;
  try {
    const response = await fetch(thumbnailUrl);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const dest = path.join(coversDir(), `${id}.jpg`);
    await writeFile(dest, buffer);
    return dest;
  } catch {
    return null;
  }
}

function mimeFromExt(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a" || ext === ".mp4") return "audio/mp4";
  if (ext === ".webm" || ext === ".weba") return "audio/webm";
  if (ext === ".ogg" || ext === ".opus") return "audio/ogg";
  if (ext === ".wav") return "audio/wav";
  return "audio/mpeg";
}

export async function downloadEntry(
  entry: ProbeEntry,
  onProgress?: (event: DownloadProgress) => void,
) {
  const { ytdlp, ffmpeg } = await ensureTools();
  const hasFfmpeg = await fileOk(ffmpeg);
  const template = path.join(audioDir(), `${entry.id}.%(ext)s`);

  const args = [
    "--no-playlist",
    "--no-warnings",
    "--newline",
    "-o",
    template,
    "--no-overwrites",
  ];

  if (hasFfmpeg) {
    args.push(
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      "--ffmpeg-location",
      ffmpeg,
    );
  } else {
    args.push("-f", "bestaudio[ext=m4a]/bestaudio/best");
  }

  args.push(entry.url);

  onProgress?.({
    phase: "download",
    message: `Baixando ${entry.title}`,
    title: entry.title,
    percent: 0,
  });

  await runCommand(ytdlp, args, (line) => {
    const match = line.match(/(\d+(?:\.\d+)?)%/);
    if (match) {
      onProgress?.({
        phase: "download",
        message: `Baixando ${entry.title}`,
        title: entry.title,
        percent: Number(match[1]),
      });
    }
  });

  const candidates = [".mp3", ".m4a", ".webm", ".opus", ".ogg", ".wav"].map(
    (ext) => path.join(audioDir(), `${entry.id}${ext}`),
  );
  const filePath = candidates.find((candidate) => existsSync(candidate));
  if (!filePath) {
    throw new Error(`O arquivo de áudio de "${entry.title}" não foi gerado.`);
  }

  const thumbnailPath = await saveThumbnail(entry.id, entry.thumbnail);

  return {
    filePath,
    thumbnailPath,
    mimeType: mimeFromExt(filePath),
    duration: entry.duration,
  };
}

export async function copyCoverForAlbum(source: string | null, albumId: string) {
  if (!source || !existsSync(source)) return null;
  const dest = path.join(coversDir(), `album-${albumId}${path.extname(source) || ".jpg"}`);
  await copyFile(source, dest);
  return dest;
}

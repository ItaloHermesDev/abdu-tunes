import "server-only";

import { spawn } from "node:child_process";
import {
  chmod,
  mkdir,
  writeFile,
  readFile,
  access,
  copyFile,
  open,
  unlink,
  stat,
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

function isEphemeralHost() {
  return /hbuilds/i.test(process.cwd());
}

function toolsRoot() {
  if (process.platform !== "win32" && process.env.HOME && isEphemeralHost()) {
    return path.join(process.env.HOME, ".abdu-tunes");
  }
  return null;
}

function binariesDir() {
  const persistent = toolsRoot();
  if (persistent) return path.join(persistent, "bin");
  return path.resolve(process.cwd(), getEnv().binDir);
}

function toolTmpDir() {
  const persistent = toolsRoot();
  if (persistent) return path.join(persistent, "tmp");
  return path.join(storageRoot(), "tmp");
}

function storageRoot() {
  return path.resolve(process.cwd(), getEnv().storageDir);
}

function toolEnv() {
  const tmp = toolTmpDir();
  const env = { ...process.env };
  delete env.LD_LIBRARY_PATH;
  delete env.LD_PRELOAD;
  delete env.NODE;
  delete env.NODE_PATH;
  const nodeDir = path.dirname(process.execPath).toLowerCase();
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const parts = (env[pathKey] || env.PATH || "").split(path.delimiter);
  env[pathKey] = parts
    .filter((part) => {
      const lower = part.toLowerCase();
      return (
        part &&
        !lower.includes("nodejs") &&
        path.resolve(part).toLowerCase() !== nodeDir
      );
    })
    .join(path.delimiter);
  env.TMPDIR = tmp;
  env.TEMP = tmp;
  env.TMP = tmp;
  env.HOME = process.env.HOME || tmp;
  env.XDG_CACHE_HOME = path.join(tmp, "cache");
  return env;
}

export function audioDir() {
  return path.join(storageRoot(), "audio");
}

export function coversDir() {
  return path.join(storageRoot(), "covers");
}

export function cookiesPath() {
  const env = getEnv();
  if (env.youtubeCookiesFile) {
    return path.resolve(env.youtubeCookiesFile);
  }
  const persistent = toolsRoot();
  if (persistent) return path.join(persistent, "youtube-cookies.txt");
  return path.join(storageRoot(), "youtube-cookies.txt");
}

function looksLikeNetscapeCookies(text: string) {
  const trimmed = text.trim();
  return (
    trimmed.length > 40 &&
    trimmed.includes("youtube.com") &&
    (trimmed.includes("# Netscape") ||
      trimmed.includes("\t") ||
      trimmed.includes(".youtube.com"))
  );
}

function jsonCookiesToNetscape(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { cookies?: unknown }).cookies)
        ? (parsed as { cookies: unknown[] }).cookies
        : null;
    if (!list?.length) return null;

    const lines = ["# Netscape HTTP Cookie File"];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const cookie = item as {
        domain?: string;
        path?: string;
        secure?: boolean;
        expirationDate?: number;
        expires?: number;
        session?: boolean;
        name?: string;
        value?: string;
      };
      if (!cookie.name || cookie.value == null || !cookie.domain) continue;
      if (!cookie.domain.includes("youtube.com") && !cookie.domain.includes("google.com")) {
        continue;
      }
      const expiry = cookie.session
        ? 0
        : Math.trunc(cookie.expirationDate || cookie.expires || 0);
      const domain = cookie.domain.startsWith(".")
        ? cookie.domain
        : cookie.domain;
      const includeSub = domain.startsWith(".") ? "TRUE" : "FALSE";
      lines.push(
        [
          domain,
          includeSub,
          cookie.path || "/",
          cookie.secure ? "TRUE" : "FALSE",
          String(expiry),
          cookie.name,
          cookie.value,
        ].join("\t"),
      );
    }
    if (lines.length < 2) return null;
    return `${lines.join("\n")}\n`;
  } catch {
    return null;
  }
}

export async function youtubeCookiesConfigured() {
  return fileOk(cookiesPath());
}

export async function saveYouTubeCookies(raw: string) {
  const text = raw.replace(/\\n/g, "\n").trim();
  const converted = text.startsWith("[") || text.startsWith("{")
    ? jsonCookiesToNetscape(text)
    : null;
  const netscape = converted || (looksLikeNetscapeCookies(text) ? text : null);
  if (!netscape) {
    throw new Error(
      "Cole o export da extensão (Netscape ou JSON). Precisa ter cookies do youtube.com.",
    );
  }
  const dest = cookiesPath();
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, netscape.endsWith("\n") ? netscape : `${netscape}\n`, {
    mode: 0o600,
  });
  if (process.platform !== "win32") {
    await chmod(dest, 0o600);
  }
}

export async function clearYouTubeCookies() {
  const dest = cookiesPath();
  if (await fileOk(dest)) {
    await unlink(dest);
  }
}

export async function readYouTubeCookieHeader() {
  const dest = cookiesPath();
  if (!(await fileOk(dest))) return "";
  const text = await readFile(dest, "utf8");
  const pairs: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length < 7) continue;
    const name = parts[5];
    const value = parts[6];
    if (name && value) pairs.push(`${name}=${value}`);
  }
  return pairs.join("; ");
}

async function seedCookiesFromEnv() {
  const env = getEnv();
  if (!env.youtubeCookies || (await fileOk(cookiesPath()))) return;
  await saveYouTubeCookies(env.youtubeCookies);
}

async function isStaleBinary(filePath: string, maxAgeMs = 3 * 24 * 60 * 60 * 1000) {
  try {
    const info = await stat(filePath);
    return Date.now() - info.mtimeMs > maxAgeMs;
  } catch {
    return true;
  }
}

async function ytDlpCommonArgs() {
  await seedCookiesFromEnv();
  const args = [
    "--no-warnings",
    "--no-cache-dir",
    "--extractor-args",
    "youtube:player_client=tv,android,ios;player_skip=js,webpage,configs",
  ];
  const cookies = cookiesPath();
  if (await fileOk(cookies)) {
    args.push("--cookies", cookies);
  }
  return args;
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
  await mkdir(toolTmpDir(), { recursive: true });
  await mkdir(audioDir(), { recursive: true });
  await mkdir(coversDir(), { recursive: true });
  await seedCookiesFromEnv();

  const env = getEnv();
  const managedYtdlp = !env.ytdlpPath;
  let ytdlp = env.ytdlpPath || path.join(binariesDir(), ytDlpName());
  const stalePython =
    managedYtdlp && (await fileOk(ytdlp)) && (await isPythonYtDlp(ytdlp));
  const staleBuild =
    managedYtdlp && (await fileOk(ytdlp)) && (await isStaleBinary(ytdlp));
  if (!(await fileOk(ytdlp)) || stalePython || staleBuild) {
    await downloadBinary(ytDlpDownloadUrl(), ytdlp);
  }

  let ffmpeg = env.ffmpegPath;
  if (!ffmpeg && !isEphemeralHost()) {
    ffmpeg = (await maybeFfmpegStatic()) || "";
  }
  if (!ffmpeg) {
    ffmpeg = path.join(binariesDir(), ffmpegName());
  }

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
      env: toolEnv(),
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
      if (output.includes("libz") || output.includes("shared libraries")) {
        reject(
          new Error(
            "O servidor bloqueou o yt-dlp na pasta do deploy. Atualize o app e importe de novo — os binários passam a ficar em ~/.abdu-tunes.",
          ),
        );
        return;
      }
      if (
        output.includes("[jsc]") ||
        output.includes("JsChallenge") ||
        output.includes("page needs to be reloaded")
      ) {
        reject(
          new Error(
            "O YouTube mudou a verificação. Atualize o app e importe de novo — o download agora evita o desafio JS que quebrou.",
          ),
        );
        return;
      }
      if (
        output.includes("not a bot") ||
        output.includes("Sign in to confirm") ||
        output.includes("--cookies")
      ) {
        reject(
          new Error(
            "O YouTube bloqueou o IP do servidor. Exporte os cookies da sua conta (cookies.txt) e cole na página de importar.",
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
  try {
    return await probeWithYtDlp(url, playlist, onProgress);
  } catch (error) {
    onProgress?.({
      phase: "probe",
      message: "O yt-dlp falhou. Tentando método alternativo...",
    });
    try {
      const { probeWithInnertube } = await import("@/lib/youtube-innertube");
      return await probeWithInnertube(url, playlist, onProgress);
    } catch (altError) {
      throw altError instanceof Error ? altError : error;
    }
  }
}

async function probeWithYtDlp(
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
    "--skip-download",
    ...(await ytDlpCommonArgs()),
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
    "--newline",
    "-o",
    template,
    "--no-overwrites",
    ...(await ytDlpCommonArgs()),
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

  try {
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
  } catch (error) {
    onProgress?.({
      phase: "download",
      message: `Método alternativo: ${entry.title}`,
      title: entry.title,
      percent: 5,
    });
    const { downloadWithInnertube } = await import("@/lib/youtube-innertube");
    const alt = await downloadWithInnertube(entry, onProgress);
    let filePath = alt.filePath;
    if (hasFfmpeg && path.extname(filePath) !== ".mp3") {
      const mp3 = path.join(audioDir(), `${entry.id}.mp3`);
      await runCommand(ffmpeg, [
        "-y",
        "-i",
        filePath,
        "-vn",
        "-codec:a",
        "libmp3lame",
        "-q:a",
        "2",
        mp3,
      ]);
      filePath = mp3;
    }
    const thumbnailPath = await saveThumbnail(entry.id, entry.thumbnail);
    return {
      filePath,
      thumbnailPath,
      mimeType: mimeFromExt(filePath),
      duration: alt.duration || entry.duration,
    };
  }

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

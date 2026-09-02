import "server-only";

import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { Constants, Innertube, Platform } from "youtubei.js";

Platform.shim.eval = (data, env) => {
  const names = Object.keys(env);
  const values = names.map((key) => env[key]);
  try {
    const result = new Function(
      ...names,
      `"use strict"; return (${data.output});`,
    )(...values);
    if (result && typeof result === "object") return result;
  } catch {
    // o script do player às vezes não é uma expressão
  }
  return new Function(...names, `"use strict";\n${data.output}`)(...values);
};
import {
  audioDir,
  readYouTubeCookieHeader,
  type DownloadProgress,
  type ProbeEntry,
  type ProbeResult,
} from "@/lib/youtube";

function videoIdFromUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").split("/")[0] || null;
    }
    return url.searchParams.get("v");
  } catch {
    return null;
  }
}

function playlistIdFromUrl(value: string) {
  try {
    return new URL(value).searchParams.get("list");
  } catch {
    return null;
  }
}

async function createClient() {
  const cookie = await readYouTubeCookieHeader();
  if (!cookie) {
    throw new Error(
      "Salve os cookies do YouTube na página de importar para usar este método.",
    );
  }
  return Innertube.create({
    cookie,
    retrieve_player: true,
    lang: "pt",
    location: "BR",
  });
}

function isHttpUrl(value: string | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function extFromMime(mime: string) {
  if (mime.includes("webm") || mime.includes("opus")) return ".webm";
  return ".m4a";
}

function clientUserAgent(client: "ANDROID" | "IOS" | "TV" | "MWEB") {
  if (client === "IOS") return Constants.CLIENTS.IOS.USER_AGENT;
  if (client === "ANDROID") return Constants.CLIENTS.ANDROID.USER_AGENT;
  if (client === "TV") return Constants.CLIENTS.TV.USER_AGENT;
  return "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36";
}

async function fetchAudioStream(
  yt: Awaited<ReturnType<typeof Innertube.create>>,
  videoId: string,
) {
  const cookie = await readYouTubeCookieHeader();
  const clients = ["IOS", "ANDROID", "TV", "MWEB"] as const;
  let lastStatus = 0;

  for (const client of clients) {
    try {
      const info = await yt.getBasicInfo(videoId, { client });
      const format = info.chooseFormat({ type: "audio", quality: "best" });
      const deciphered = await format.decipher(yt.session.player);
      const url = [deciphered, format.url].find(isHttpUrl);
      if (!url) continue;

      const streamUrl = new URL(url);
      if (streamUrl.searchParams.get("n")?.startsWith("enhanced_except_")) {
        continue;
      }
      if (info.cpn && !streamUrl.searchParams.has("cpn")) {
        streamUrl.searchParams.set("cpn", info.cpn);
      }

      const response = await yt.session.http.fetch_function(streamUrl.toString(), {
        method: "GET",
        headers: {
          ...Constants.STREAM_HEADERS,
          "user-agent": clientUserAgent(client),
          cookie,
        },
        redirect: "follow",
      });
      if (response.ok && response.body) {
        return {
          response,
          info,
          ext: extFromMime(format.mime_type || ""),
        };
      }
      lastStatus = response.status;
    } catch {
      // tenta o próximo cliente
    }
  }

  const info = await yt.getBasicInfo(videoId, { client: "IOS" });
  try {
    const stream = await info.download({ type: "audio", quality: "best" });
    return {
      response: new Response(stream as BodyInit),
      info,
      ext: ".m4a",
    };
  } catch {
    throw new Error(
      lastStatus
        ? `Falha ao baixar o áudio (${lastStatus}).`
        : "Não foi possível obter a URL de áudio deste vídeo.",
    );
  }
}

function thumbnailOf(thumbnails: Array<{ url?: string }> | undefined) {
  return thumbnails?.at(-1)?.url || null;
}

export async function probeWithInnertube(
  url: string,
  playlist: boolean,
  onProgress?: (event: DownloadProgress) => void,
): Promise<ProbeResult> {
  onProgress?.({
    phase: "probe",
    message: "Lendo o YouTube pelo método alternativo...",
  });
  const yt = await createClient();
  const playlistId = playlist ? playlistIdFromUrl(url) : null;

  if (playlist && playlistId && !playlistId.startsWith("RD")) {
    let feed = await yt.getPlaylist(playlistId);
    const items = [...feed.items];
    while (feed.has_continuation && items.length < 400) {
      feed = await feed.getContinuation();
      items.push(...feed.items);
    }
    const entries = items
      .map((item) => {
        const video = item as {
          id?: string;
          title?: { toString?: () => string } | string;
          author?: { name?: string };
          duration?: { seconds?: number };
          thumbnails?: Array<{ url?: string }>;
        };
        if (!video.id) return null;
        const title =
          typeof video.title === "string"
            ? video.title
            : video.title?.toString?.() || "Faixa sem título";
        return {
          id: video.id,
          title,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          duration: Number(video.duration?.seconds || 0),
          thumbnail: thumbnailOf(video.thumbnails),
          artist: video.author?.name || "Desconhecido",
        } satisfies ProbeEntry;
      })
      .filter((entry): entry is ProbeEntry => Boolean(entry));

    if (!entries.length) {
      throw new Error("Nenhuma faixa encontrada nesta playlist.");
    }
    return {
      type: "playlist",
      title: feed.info.title || entries[0].title,
      thumbnail: entries[0].thumbnail,
      entries,
    };
  }

  const id = videoIdFromUrl(url);
  if (!id) throw new Error("Não foi possível ler o ID do vídeo.");
  const info = await yt.getBasicInfo(id);
  const title = info.basic_info.title || "Faixa sem título";
  const artist =
    info.basic_info.author ||
    info.basic_info.channel?.name ||
    "Desconhecido";
  return {
    type: "video",
    title,
    thumbnail: thumbnailOf(info.basic_info.thumbnail),
    entries: [
      {
        id,
        title,
        url: `https://www.youtube.com/watch?v=${id}`,
        duration: Number(info.basic_info.duration || 0),
        thumbnail: thumbnailOf(info.basic_info.thumbnail),
        artist,
      },
    ],
  };
}

export async function downloadWithInnertube(
  entry: ProbeEntry,
  onProgress?: (event: DownloadProgress) => void,
) {
  const yt = await createClient();
  onProgress?.({
    phase: "download",
    message: `Baixando ${entry.title}`,
    title: entry.title,
    percent: 8,
  });

  const { response, info, ext } = await fetchAudioStream(yt, entry.id);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar o áudio (${response.status}).`);
  }

  await mkdir(audioDir(), { recursive: true });
  const dest = path.join(audioDir(), `${entry.id}${ext}`);
  await pipeline(
    Readable.fromWeb(response.body as never),
    createWriteStream(dest),
  );

  if (!existsSync(dest)) {
    throw new Error(`O arquivo de áudio de "${entry.title}" não foi gerado.`);
  }

  onProgress?.({
    phase: "download",
    message: `Baixando ${entry.title}`,
    title: entry.title,
    percent: 90,
  });

  return {
    filePath: dest,
    mimeType: "audio/mp4",
    duration: Number(info.basic_info.duration || entry.duration || 0),
  };
}

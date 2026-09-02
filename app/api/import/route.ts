import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  createAlbum,
  createTrack,
  getAlbum,
  updateAlbum,
} from "@/lib/db";
import {
  copyCoverForAlbum,
  downloadEntry,
  probeYouTube,
  type DownloadProgress,
} from "@/lib/youtube";
import { isYouTubeUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  url: z.string().url(),
  mode: z.enum(["single", "playlist"]),
  destination: z.enum(["loose", "album", "new"]),
  albumId: z.string().optional(),
  albumTitle: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = schema.safeParse(await request.json());
  if (!body.success || !isYouTubeUrl(body.data.url)) {
    return Response.json(
      { error: "Cole um link válido do YouTube ou YouTube Music." },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const playlist = body.data.mode === "playlist";
        const probe = await probeYouTube(body.data.url, playlist, (event) =>
          send(event as unknown as Record<string, unknown>),
        );

        const entries =
          body.data.mode === "single" ? probe.entries.slice(0, 1) : probe.entries;

        let albumId: string | null = null;
        if (body.data.destination === "album") {
          if (!body.data.albumId) throw new Error("Escolha um álbum.");
          const album = await getAlbum(user.profileId, body.data.albumId);
          if (!album) throw new Error("Álbum não encontrado.");
          albumId = album.id;
        }
        if (body.data.destination === "new") {
          const title = body.data.albumTitle?.trim() || probe.title;
          const album = await createAlbum({
            userId: user.id,
            profileId: user.profileId,
            title,
            description: `Importado de ${probe.type === "playlist" ? "playlist" : "YouTube"}`,
          });
          albumId = album?.id ?? null;
          send({ message: `Álbum “${title}” criado.` });
        }

        let firstCover: string | null = null;
        for (const [index, entry] of entries.entries()) {
          const onProgress = (event: DownloadProgress) => {
            const overall = Math.round(
              ((index + (event.percent || 0) / 100) / entries.length) * 100,
            );
            send({
              message: event.message,
              percent: overall,
              current: index + 1,
              total: entries.length,
              title: entry.title,
            });
          };

          send({
            message: `(${index + 1}/${entries.length}) ${entry.title}`,
            percent: Math.round((index / entries.length) * 100),
          });

          const downloaded = await downloadEntry(entry, onProgress);
          if (!firstCover) firstCover = downloaded.thumbnailPath;

          await createTrack({
            userId: user.id,
            profileId: user.profileId,
            albumId,
            title: entry.title,
            artist: entry.artist,
            duration: downloaded.duration || entry.duration,
            filePath: downloaded.filePath,
            thumbnailPath: downloaded.thumbnailPath,
            youtubeUrl: entry.url,
            youtubeId: entry.id,
            mimeType: downloaded.mimeType,
          });
        }

        if (albumId && firstCover) {
          const album = await getAlbum(user.profileId, albumId);
          if (album && !album.coverPath) {
            const cover = await copyCoverForAlbum(firstCover, albumId);
            if (cover) await updateAlbum(user.profileId, albumId, { coverPath: cover });
          }
        }

        send({
          done: true,
          percent: 100,
          message: `${entries.length} faixa${entries.length === 1 ? "" : "s"} importada${entries.length === 1 ? "" : "s"}.`,
        });
      } catch (error) {
        send({
          error:
            error instanceof Error
              ? error.message
              : "Falha ao importar do YouTube.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

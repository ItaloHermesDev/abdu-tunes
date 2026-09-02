import { getCurrentUser } from "@/lib/auth";
import { getTrack } from "@/lib/db";
import { fileStat, nodeStreamToWeb } from "@/lib/media";
import { existsSync } from "node:fs";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: RouteContext<"/api/stream/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });
  const { id } = await context.params;
  const track = await getTrack(user.id, id);
  if (!track || !existsSync(track.filePath)) {
    return new Response("Faixa não encontrada", { status: 404 });
  }

  const stat = fileStat(track.filePath);
  const range = request.headers.get("range");

  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    const start = match ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;
    const chunk = end - start + 1;
    return new Response(nodeStreamToWeb(track.filePath, start, end), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunk),
        "Content-Type": track.mimeType,
      },
    });
  }

  return new Response(nodeStreamToWeb(track.filePath), {
    headers: {
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Content-Type": track.mimeType,
    },
  });
}

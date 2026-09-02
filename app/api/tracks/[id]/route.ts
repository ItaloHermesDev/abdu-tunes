import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { deleteTrack, getTrack, updateTrack } from "@/lib/db";

const schema = z.object({
  albumId: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  artist: z.string().min(1).max(200).optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/tracks/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  const body = schema.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });
  const track = await updateTrack(user.id, id, body.data);
  if (!track) return Response.json({ error: "Faixa não encontrada" }, { status: 404 });
  return Response.json({ track });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/tracks/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  const track = await deleteTrack(user.id, id);
  if (!track) return Response.json({ error: "Faixa não encontrada" }, { status: 404 });
  if (existsSync(track.filePath)) await unlink(track.filePath).catch(() => undefined);
  return Response.json({ ok: true });
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tracks/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  const track = await getTrack(user.id, id);
  if (!track) return Response.json({ error: "Faixa não encontrada" }, { status: 404 });
  return Response.json({ track });
}

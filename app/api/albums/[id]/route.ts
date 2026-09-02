import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { deleteAlbum, getAlbum, listTracks, updateAlbum } from "@/lib/db";

const schema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(400).nullable().optional(),
});

export async function GET(
  _request: Request,
  context: RouteContext<"/api/albums/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  const album = await getAlbum(user.profileId, id);
  if (!album) return Response.json({ error: "Álbum não encontrado" }, { status: 404 });
  const tracks = await listTracks(user.profileId, { albumId: id });
  return Response.json({ album, tracks });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/albums/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  const body = schema.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });
  const album = await updateAlbum(user.profileId, id, body.data);
  if (!album) return Response.json({ error: "Álbum não encontrado" }, { status: 404 });
  return Response.json({ album });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/albums/[id]">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await context.params;
  await deleteAlbum(user.profileId, id);
  return Response.json({ ok: true });
}

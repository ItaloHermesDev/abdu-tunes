import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createAlbum, listAlbums } from "@/lib/db";

const schema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(400).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  return Response.json({ albums: await listAlbums(user.profileId) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Informe um nome para o álbum." }, { status: 400 });
  }
  const album = await createAlbum({
    userId: user.id,
    profileId: user.profileId,
    title: body.data.title.trim(),
    description: body.data.description?.trim() || null,
  });
  return Response.json({ album }, { status: 201 });
}

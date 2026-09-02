import { getCurrentUser } from "@/lib/auth";
import { listTracks } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const tracks = await listTracks(user.profileId, {
    albumId: searchParams.get("albumId") || undefined,
    loose: searchParams.get("loose") === "1",
    favorite: searchParams.get("favorite") === "1",
    query: searchParams.get("q") || undefined,
  });
  return Response.json({ tracks });
}

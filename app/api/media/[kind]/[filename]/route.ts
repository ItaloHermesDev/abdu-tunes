import { getCurrentUser } from "@/lib/auth";
import { nodeStreamToWeb, resolveStorageFile } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/media/[kind]/[filename]">,
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado", { status: 401 });
  const { kind, filename } = await context.params;
  if (kind !== "covers" && kind !== "audio" && kind !== "avatars") {
    return new Response("Not found", { status: 404 });
  }
  const filePath = resolveStorageFile(kind, filename);
  if (!filePath) return new Response("Not found", { status: 404 });
  const type =
    kind === "audio"
      ? "audio/mpeg"
      : filename.endsWith(".png")
        ? "image/png"
        : filename.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
  return new Response(nodeStreamToWeb(filePath), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=86400",
    },
  });
}

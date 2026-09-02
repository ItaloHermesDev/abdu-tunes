import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  clearYouTubeCookies,
  saveYouTubeCookies,
  youtubeCookiesConfigured,
} from "@/lib/youtube";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  return Response.json({ configured: await youtubeCookiesConfigured() });
}

const schema = z.object({
  cookies: z.string().min(40).max(400_000),
});

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      { error: "Cole o conteúdo do cookies.txt." },
      { status: 400 },
    );
  }
  try {
    await saveYouTubeCookies(body.data.cookies);
    return Response.json({ configured: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar os cookies.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  await clearYouTubeCookies();
  return Response.json({ configured: false });
}

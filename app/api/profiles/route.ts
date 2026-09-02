import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getCurrentUser, createSession } from "@/lib/auth";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
} from "@/lib/db";
import { getEnv } from "@/lib/env";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const profiles = await listProfiles(user.id);
  return Response.json({
    currentId: user.profileId,
    profiles,
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const body = createSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Informe o nome do perfil." }, { status: 400 });
  }
  const profile = await createProfile(user.id, body.data.name);
  await createSession(user.id, profile.id);
  return Response.json({ profile }, { status: 201 });
}

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  switchTo: z.string().optional(),
  deleteId: z.string().optional(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });
  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (body.data.switchTo) {
    await createSession(user.id, body.data.switchTo);
    return Response.json({ ok: true, profileId: body.data.switchTo });
  }

  if (body.data.deleteId) {
    try {
      await deleteProfile(user.id, body.data.deleteId);
      if (body.data.deleteId === user.profileId) {
        await createSession(user.id);
      }
      return Response.json({ ok: true });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Não foi possível apagar." },
        { status: 400 },
      );
    }
  }

  const profile = await updateProfile(user.id, user.profileId, {
    name: body.data.name,
  });
  return Response.json({ profile });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Envie uma imagem." }, { status: 400 });
  }
  if (file.size > 2_500_000) {
    return Response.json({ error: "A imagem deve ter no máximo 2,5 MB." }, { status: 400 });
  }
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    return Response.json({ error: "Use JPG, PNG ou WebP." }, { status: 400 });
  }

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const dir = path.resolve(process.cwd(), getEnv().storageDir, "avatars");
  await mkdir(dir, { recursive: true });
  const filename = `${user.profileId}${ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const profile = await updateProfile(user.id, user.profileId, { avatarPath: filePath });
  return Response.json({ profile });
}

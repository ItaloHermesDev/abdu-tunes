import { z } from "zod";
import { createUser, findUserByEmail } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return Response.json(
      { error: "Preencha nome, e-mail válido e senha com 8+ caracteres." },
      { status: 400 },
    );
  }

  const existing = await findUserByEmail(body.data.email);
  if (existing) {
    return Response.json({ error: "Este e-mail já tem conta." }, { status: 409 });
  }

  const user = await createUser({
    name: body.data.name.trim(),
    email: body.data.email,
    passwordHash: await hashPassword(body.data.password),
  });
  await createSession(user.id);
  return Response.json({ ok: true });
}

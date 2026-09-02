import { z } from "zod";
import { findUserByEmail } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const user = await findUserByEmail(body.data.email);
  if (!user || !(await verifyPassword(body.data.password, user.passwordHash))) {
    return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createSession(user.id);
  return Response.json({ ok: true });
}

import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { getEnv } from "@/lib/env";
import { findUserById, getDefaultProfile, getProfile } from "@/lib/db";
import type { PublicUser } from "@/lib/types";

const encoder = new TextEncoder();

function secretKey() {
  return encoder.encode(getEnv().authSecret);
}

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function createSession(userId: string, profileId?: string) {
  const profile = profileId
    ? await getProfile(userId, profileId)
    : await getDefaultProfile(userId);
  if (!profile) {
    throw new Error("Perfil não encontrado.");
  }

  const token = await new SignJWT({ sub: userId, pid: profile.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(getEnv().authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(getEnv().authCookieName);
}

export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getEnv().authCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    const user = await findUserById(payload.sub);
    if (!user) return null;
    const profile =
      (typeof payload.pid === "string"
        ? await getProfile(user.id, payload.pid)
        : null) ?? (await getDefaultProfile(user.id));
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileId: profile.id,
      profileName: profile.name,
      avatarUrl: profile.avatarUrl,
    };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

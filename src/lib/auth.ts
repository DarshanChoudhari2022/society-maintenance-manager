import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { encryptSession, decryptSession } from "./session";
import type { SessionPayload } from "./session";

export type { SessionPayload };
export const encrypt = encryptSession;
export const decrypt = decryptSession;

export async function createSession(user: {
  id: string;
  societyId: string | null;
  role: string;
  name: string;
  email: string;
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encryptSession({
    userId: user.id,
    societyId: user.societyId || "",
    role: user.role,
    name: user.name,
    email: user.email,
    expiresAt,
  });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return decryptSession(session);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSessionUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { society: true },
  });
  return user;
}

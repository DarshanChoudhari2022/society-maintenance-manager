import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  societyId: string;
  role: string;
  name: string;
  email: string;
  expiresAt: Date;
}

export async function encryptSession(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decryptSession(
  session: string | undefined = ""
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

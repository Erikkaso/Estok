import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "estok_token";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type Perfil = "ADMIN" | "OPERADOR";

export interface SessionPayload {
  sub: string;
  perfil: Perfil;
  tokenVersao: number;
}

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ?? "estok-dev-jwt-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    perfil: payload.perfil,
    tokenVersao: payload.tokenVersao,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.sub !== "string" ||
      (payload.perfil !== "ADMIN" && payload.perfil !== "OPERADOR") ||
      typeof payload.tokenVersao !== "number"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      perfil: payload.perfil,
      tokenVersao: payload.tokenVersao,
    };
  } catch {
    return null;
  }
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from "@/lib/jwt";

export { SESSION_COOKIE_NAME, signSessionToken, verifySessionToken } from "@/lib/jwt";

export interface AuthenticatedUser {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      tokenVersao: true,
    },
  });

  if (
    !usuario ||
    !usuario.ativo ||
    usuario.tokenVersao !== payload.tokenVersao
  ) {
    return null;
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
  };
}

export async function requirePageAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdminPageAuth(): Promise<AuthenticatedUser> {
  const user = await requirePageAuth();
  if (user.perfil !== PerfilUsuario.ADMIN) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireApiAuth(): Promise<
  { user: AuthenticatedUser } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }
  return { user };
}

export async function requireAdminApiAuth(): Promise<
  { user: AuthenticatedUser } | { error: NextResponse }
> {
  const auth = await requireApiAuth();
  if ("error" in auth) {
    return auth;
  }
  if (auth.user.perfil !== PerfilUsuario.ADMIN) {
    return {
      error: NextResponse.json(
        { error: "Acesso restrito a administradores." },
        { status: 403 }
      ),
    };
  }
  return auth;
}

export function getSessionCookieOptions(
  maxAge = SESSION_DURATION_SECONDS,
  isHttps = false
) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isHttps,
    path: "/",
    maxAge,
  };
}

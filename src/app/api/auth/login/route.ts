import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionCookieOptions, signSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Informe e-mail e senha." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senhaHash: true,
        perfil: true,
        ativo: true,
        tokenVersao: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo." },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo." },
        { status: 401 }
      );
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });

    const token = await signSessionToken({
      sub: usuario.id,
      perfil: usuario.perfil,
      tokenVersao: usuario.tokenVersao,
    });

    const response = NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      },
    });

    const isHttps =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set({
      ...getSessionCookieOptions(undefined, isHttps),
      value: token,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Não foi possível realizar o login." },
      { status: 500 }
    );
  }
}

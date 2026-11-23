import bcrypt from "bcryptjs";
import { NextRequest, NextResponse, connection } from "next/server";
import { PerfilUsuario, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAuth } from "@/lib/auth";

export async function GET() {
  await connection();

  const auth = await requireAdminApiAuth();
  if ("error" in auth) return auth.error;

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      ultimoAcesso: true,
      criadoEm: true,
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return NextResponse.json({ usuarios });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";
    const perfil =
      body?.perfil === PerfilUsuario.ADMIN
        ? PerfilUsuario.ADMIN
        : PerfilUsuario.OPERADOR;

    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 6) {
      return NextResponse.json(
        {
          error:
            "Nome, e-mail válido e senha (mínimo 6 caracteres) são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        perfil,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        ultimoAcesso: true,
      },
    });

    return NextResponse.json({ usuario }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Já existe um usuário com este e-mail." },
        { status: 409 }
      );
    }
    console.error("Failed to create usuario:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar usuário." },
      { status: 500 }
    );
  }
}

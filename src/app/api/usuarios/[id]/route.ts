import { NextRequest, NextResponse } from "next/server";
import { PerfilUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAuth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  try {
    const body = await request.json();
    const ativo =
      typeof body?.ativo === "boolean" ? body.ativo : undefined;
    const perfil =
      body?.perfil === PerfilUsuario.ADMIN ||
      body?.perfil === PerfilUsuario.OPERADOR
        ? (body.perfil as PerfilUsuario)
        : undefined;

    if (id === auth.user.id && ativo === false) {
      return NextResponse.json(
        { error: "Você não pode inativar sua própria conta." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(ativo !== undefined ? { ativo } : {}),
        ...(perfil !== undefined ? { perfil } : {}),
        ...(ativo === false ? { tokenVersao: { increment: 1 } } : {}),
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

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Failed to update usuario:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário." },
      { status: 500 }
    );
  }
}

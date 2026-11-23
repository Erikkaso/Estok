import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const novaSenha = typeof body?.novaSenha === "string" ? body.novaSenha : "";

    if (!token || novaSenha.length < 6) {
      return NextResponse.json(
        { error: "Token inválido ou senha com menos de 6 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const usuario = await prisma.usuario.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiraEm: { gt: new Date() },
        ativo: true,
      },
      select: { id: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Link de recuperação inválido ou expirado." },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senhaHash,
        resetTokenHash: null,
        resetTokenExpiraEm: null,
        tokenVersao: { increment: 1 },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Não foi possível redefinir a senha." },
      { status: 500 }
    );
  }
}

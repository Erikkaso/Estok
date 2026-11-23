import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, ativo: true, nome: true },
    });

    let devResetUrl: string | undefined;

    if (usuario && usuario.ativo) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiraEm: expiraEm,
        },
      });

      const path = `/redefinir-senha?token=${token}`;
      const base = process.env.APP_URL ?? request.nextUrl.origin;
      const enviado = await enviarEmail(
        email,
        "Estok — redefinição de senha",
        `Olá, ${usuario.nome}.

Para redefinir sua senha acesse (válido por 1 hora):
${base}${path}

Se não foi você, ignore este e-mail.`
      );
      if (!enviado && process.env.NODE_ENV !== "production") {
        devResetUrl = path; // sem provedor de e-mail configurado: link só em desenvolvimento
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        "Se houver uma conta associada a este e-mail, enviamos as instruções para redefinir sua senha.",
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  } catch (error) {
    console.error("Password recovery error:", error);
    return NextResponse.json(
      { error: "Não foi possível processar a solicitação." },
      { status: 500 }
    );
  }
}

import { NextResponse, connection } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await connection();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [usuarios, produtos, movimentacoes] = await Promise.all([
      prisma.usuario.count(),
      prisma.produto.count(),
      prisma.movimentacao.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      branch: process.env.NEON_BRANCH ?? null,
      counts: {
        usuarios,
        produtos,
        movimentacoes,
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}

import { NextRequest, NextResponse, connection } from "next/server";
import { StatusProduto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiAuth } from "@/lib/auth";
import { consolidar, intervaloBR } from "@/lib/relatorios";

export async function GET(request: NextRequest) {
  await connection();

  const auth = await requireAdminApiAuth();
  if ("error" in auth) return auth.error;

  const sp = request.nextUrl.searchParams;
  const intervalo = intervaloBR(sp.get("inicio"), sp.get("fim"));
  if (!intervalo) {
    return NextResponse.json(
      { error: "Período inválido (máximo de 366 dias, início antes do fim)." },
      { status: 400 }
    );
  }

  try {
    const [movs, estoque] = await Promise.all([
      prisma.movimentacao.findMany({
        where: { criadoEm: { gte: intervalo.inicio, lte: intervalo.fim } },
        select: {
          tipo: true,
          quantidade: true,
          motivoBaixa: true,
          criadoEm: true,
          produto: {
            select: { id: true, nome: true, precoVenda: true, precoCusto: true },
          },
        },
      }),
      prisma.produto.aggregate({
        where: { status: StatusProduto.ATIVO },
        _sum: { quantidadeEstoque: true },
      }),
    ]);

    const consolidado = consolidar(
      movs.map((m) => ({
        tipo: m.tipo,
        quantidade: m.quantidade,
        motivoBaixa: m.motivoBaixa,
        criadoEm: m.criadoEm,
        produtoId: m.produto.id,
        produtoNome: m.produto.nome,
        precoVenda: Number(m.produto.precoVenda),
        precoCusto: Number(m.produto.precoCusto),
      })),
      estoque._sum.quantidadeEstoque ?? 0,
      intervalo.inicioStr,
      intervalo.fimStr
    );

    return NextResponse.json({ consolidado });
  } catch (error) {
    console.error("Failed to build relatorio:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório." },
      { status: 500 }
    );
  }
}

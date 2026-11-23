import { NextRequest, NextResponse, connection } from "next/server";
import {
  MotivoBaixa,
  Prisma,
  StatusProduto,
  TipoMovimentacao,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await connection();

  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const produtoId = request.nextUrl.searchParams.get("produtoId")?.trim();
  const tipoParam = request.nextUrl.searchParams.get("tipo")?.trim();
  const responsavelId = request.nextUrl.searchParams
    .get("responsavelId")
    ?.trim();
  const dataInicio = request.nextUrl.searchParams.get("dataInicio")?.trim();
  const dataFim = request.nextUrl.searchParams.get("dataFim")?.trim();

  try {
    const tipo =
      tipoParam === TipoMovimentacao.ENTRADA ||
      tipoParam === TipoMovimentacao.SAIDA ||
      tipoParam === TipoMovimentacao.BAIXA
        ? tipoParam
        : undefined;

    const criadoEm: Prisma.DateTimeFilter = {};
    if (dataInicio) {
      const start = new Date(`${dataInicio}T00:00:00.000Z`);
      if (!Number.isNaN(start.getTime())) criadoEm.gte = start;
    }
    if (dataFim) {
      const end = new Date(`${dataFim}T23:59:59.999Z`);
      if (!Number.isNaN(end.getTime())) criadoEm.lte = end;
    }

    const movimentacoes = await prisma.movimentacao.findMany({
      where: {
        ...(produtoId ? { produtoId } : {}),
        ...(tipo ? { tipo } : {}),
        ...(responsavelId ? { responsavelId } : {}),
        ...(Object.keys(criadoEm).length > 0 ? { criadoEm } : {}),
      },
      select: {
        id: true,
        tipo: true,
        quantidade: true,
        saldoAnterior: true,
        saldoPosterior: true,
        motivoBaixa: true,
        observacao: true,
        criadoEm: true,
        produto: {
          select: {
            id: true,
            nome: true,
            sku: true,
          },
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { criadoEm: "desc" },
      take: 150,
    });

    return NextResponse.json({ movimentacoes });
  } catch (error) {
    console.error("Failed to fetch movimentacoes:", error);
    return NextResponse.json(
      { error: "Erro ao consultar histórico de movimentações." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const produtoId =
      typeof body?.produtoId === "string" ? body.produtoId.trim() : "";
    const tipo = body?.tipo as TipoMovimentacao;
    const quantidade = Number(body?.quantidade);
    const motivoBaixa = body?.motivoBaixa as MotivoBaixa | undefined;
    const observacao =
      typeof body?.observacao === "string" && body.observacao.trim()
        ? body.observacao.trim()
        : null;

    if (
      !produtoId ||
      (tipo !== TipoMovimentacao.ENTRADA &&
        tipo !== TipoMovimentacao.SAIDA &&
        tipo !== TipoMovimentacao.BAIXA)
    ) {
      return NextResponse.json(
        { error: "Produto e tipo de movimentação são obrigatórios." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return NextResponse.json(
        { error: "A quantidade deve ser um número inteiro maior que zero." },
        { status: 400 }
      );
    }

    if (
      tipo === TipoMovimentacao.BAIXA &&
      (!motivoBaixa || !Object.values(MotivoBaixa).includes(motivoBaixa))
    ) {
      return NextResponse.json(
        { error: "Selecione um motivo válido para a baixa." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id: produtoId },
        select: {
          id: true,
          nome: true,
          status: true,
          quantidadeEstoque: true,
        },
      });

      if (!produto) {
        return { error: "Produto não encontrado.", status: 404 as const };
      }

      if (produto.status === StatusProduto.INATIVO) {
        return {
          error:
            "Produto inativo não permite novas movimentações de estoque.",
          status: 400 as const,
        };
      }

      const saldoAnterior = produto.quantidadeEstoque;
      let saldoPosterior: number;

      if (tipo === TipoMovimentacao.ENTRADA) {
        saldoPosterior = saldoAnterior + quantidade;
      } else {
        if (quantidade > saldoAnterior) {
          return {
            error: `Quantidade (${quantidade}) excede o saldo disponível (${saldoAnterior}).`,
            status: 400 as const,
          };
        }
        saldoPosterior = saldoAnterior - quantidade;
      }

      await tx.produto.update({
        where: { id: produto.id },
        data: { quantidadeEstoque: saldoPosterior },
      });

      const movimentacao = await tx.movimentacao.create({
        data: {
          tipo,
          quantidade,
          saldoAnterior,
          saldoPosterior,
          motivoBaixa:
            tipo === TipoMovimentacao.BAIXA ? motivoBaixa : null,
          observacao,
          produtoId: produto.id,
          responsavelId: auth.user.id,
        },
        select: {
          id: true,
          tipo: true,
          quantidade: true,
          saldoAnterior: true,
          saldoPosterior: true,
          motivoBaixa: true,
          criadoEm: true,
        },
      });

      return { movimentacao };
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { movimentacao: result.movimentacao },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create movimentacao:", error);
    return NextResponse.json(
      { error: "Erro ao registrar movimentação." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PerfilUsuario, Prisma, StatusProduto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const isAdmin = auth.user.perfil === PerfilUsuario.ADMIN;

  const produto = await prisma.produto.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      descricao: true,
      categoria: true,
      sku: true,
      codigoBarras: true,
      quantidadeEstoque: true,
      estoqueMinimo: true,
      precoCusto: isAdmin,
      precoVenda: true,
      status: true,
    },
  });

  if (!produto) {
    return NextResponse.json(
      { error: "Produto não encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    produto: {
      ...produto,
      precoVenda: Number(produto.precoVenda),
      ...(isAdmin && "precoCusto" in produto
        ? { precoCusto: Number(produto.precoCusto) }
        : {}),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const isAdmin = auth.user.perfil === PerfilUsuario.ADMIN;

  try {
    const body = await request.json();
    const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
    const descricao =
      typeof body?.descricao === "string" && body.descricao.trim()
        ? body.descricao.trim()
        : null;
    const categoria =
      typeof body?.categoria === "string" ? body.categoria.trim() : "";
    const sku =
      typeof body?.sku === "string" ? body.sku.trim().toUpperCase() : "";
    const codigoBarras =
      typeof body?.codigoBarras === "string" && body.codigoBarras.trim()
        ? body.codigoBarras.trim()
        : null;
    const estoqueMinimo = Number(body?.estoqueMinimo ?? 0);
    const precoVenda = Number(body?.precoVenda ?? 0);
    const status =
      body?.status === StatusProduto.INATIVO
        ? StatusProduto.INATIVO
        : StatusProduto.ATIVO;

    if (!nome || !categoria || !sku) {
      return NextResponse.json(
        { error: "Nome, categoria e SKU são obrigatórios." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(estoqueMinimo) ||
      estoqueMinimo < 0 ||
      !Number.isFinite(precoVenda) ||
      precoVenda < 0
    ) {
      return NextResponse.json(
        { error: "Estoque mínimo e preço de venda devem ser válidos (>= 0)." },
        { status: 400 }
      );
    }

    const data: Prisma.ProdutoUpdateInput = {
      nome,
      descricao,
      categoria,
      sku,
      codigoBarras,
      estoqueMinimo,
      status,
    };

    if (isAdmin) {
      data.precoVenda = precoVenda.toFixed(2);
    }

    if (isAdmin && body?.precoCusto !== undefined) {
      const precoCusto = Number(body.precoCusto);
      if (!Number.isFinite(precoCusto) || precoCusto < 0) {
        return NextResponse.json(
          { error: "Preço de custo inválido." },
          { status: 400 }
        );
      }
      data.precoCusto = precoCusto.toFixed(2);
    }

    // Never updates quantidadeEstoque when editing product or pricing
    const produto = await prisma.produto.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        sku: true,
        status: true,
      },
    });

    return NextResponse.json({ produto });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "SKU ou código de barras já está em uso." },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Produto não encontrado." },
          { status: 404 }
        );
      }
    }
    console.error("Failed to update produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto." },
      { status: 500 }
    );
  }
}

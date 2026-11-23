import { NextRequest, NextResponse, connection } from "next/server";
import { PerfilUsuario, Prisma, StatusProduto } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await connection();

  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const statusParam = request.nextUrl.searchParams.get("status");
  const isAdmin = auth.user.perfil === PerfilUsuario.ADMIN;

  try {
    const where: Prisma.ProdutoWhereInput = {
      ...(statusParam === StatusProduto.ATIVO ||
      statusParam === StatusProduto.INATIVO
        ? { status: statusParam }
        : statusParam === "BAIXO" || statusParam === "SEM_ESTOQUE"
          ? { status: StatusProduto.ATIVO }
          : {}),
      ...(q
        ? {
            OR: [
              { nome: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { codigoBarras: { contains: q, mode: "insensitive" } },
              { categoria: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const rows = await prisma.produto.findMany({
      where,
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
      orderBy: { nome: "asc" },
      take: 100,
    });

    const filtered = rows.filter((item) => {
      if (statusParam === "SEM_ESTOQUE") return item.quantidadeEstoque === 0;
      if (statusParam === "BAIXO") {
        return (
          item.quantidadeEstoque > 0 &&
          item.quantidadeEstoque <= item.estoqueMinimo
        );
      }
      return true;
    });

    const produtos = filtered.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      categoria: p.categoria,
      sku: p.sku,
      codigoBarras: p.codigoBarras,
      quantidadeEstoque: p.quantidadeEstoque,
      estoqueMinimo: p.estoqueMinimo,
      precoVenda: Number(p.precoVenda),
      ...(isAdmin && "precoCusto" in p
        ? { precoCusto: Number(p.precoCusto) }
        : {}),
      status: p.status,
    }));

    return NextResponse.json({ produtos });
  } catch (error) {
    console.error("Failed to fetch produtos:", error);
    return NextResponse.json(
      { error: "Erro ao consultar produtos no banco de dados." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if ("error" in auth) return auth.error;

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
    const precoCusto = isAdmin ? Number(body?.precoCusto ?? 0) : 0;
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
      precoVenda < 0 ||
      !Number.isFinite(precoCusto) ||
      precoCusto < 0
    ) {
      return NextResponse.json(
        { error: "Estoque mínimo e preços devem ser valores válidos (>= 0)." },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        categoria,
        sku,
        codigoBarras,
        estoqueMinimo,
        precoCusto: precoCusto.toFixed(2),
        precoVenda: precoVenda.toFixed(2),
        status,
      },
      select: {
        id: true,
        nome: true,
        sku: true,
        status: true,
      },
    });

    return NextResponse.json({ produto }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "SKU ou código de barras já cadastrado." },
        { status: 409 }
      );
    }
    console.error("Failed to create produto:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar produto." },
      { status: 500 }
    );
  }
}

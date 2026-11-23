import { Suspense } from "react";
import { connection } from "next/server";
import { StatusProduto } from "@prisma/client";
import { MovimentacaoForm } from "@/components/MovimentacaoForm";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function BaixaLoader({
  searchParams,
}: {
  searchParams: Promise<{ produtoId?: string }>;
}) {
  await connection();
  await requirePageAuth();
  const { produtoId } = await searchParams;

  const produtos = await prisma.produto.findMany({
    where: { status: StatusProduto.ATIVO },
    select: {
      id: true,
      nome: true,
      categoria: true,
      sku: true,
      codigoBarras: true,
      quantidadeEstoque: true,
    },
    orderBy: { nome: "asc" },
  });

  return (
    <MovimentacaoForm
      tipo="BAIXA"
      produtos={produtos}
      initialProdutoId={produtoId}
    />
  );
}

export default function BaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ produtoId?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl text-sm text-slate-500">
          Carregando produtos...
        </div>
      }
    >
      <BaixaLoader searchParams={searchParams} />
    </Suspense>
  );
}

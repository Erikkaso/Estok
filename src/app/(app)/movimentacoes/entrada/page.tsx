import { Suspense } from "react";
import { connection } from "next/server";
import { StatusProduto } from "@prisma/client";
import { MovimentacaoForm } from "@/components/MovimentacaoForm";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function EntradaLoader({
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
      tipo="ENTRADA"
      produtos={produtos}
      initialProdutoId={produtoId}
    />
  );
}

export default function EntradaPage({
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
      <EntradaLoader searchParams={searchParams} />
    </Suspense>
  );
}

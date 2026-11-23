import { Suspense } from "react";
import { connection } from "next/server";
import { ProdutosClient, type ProdutoItem } from "@/components/ProdutosClient";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ProdutosLoader() {
  await connection();
  await requirePageAuth();

  const rows = await prisma.produto.findMany({
    select: {
      id: true,
      nome: true,
      categoria: true,
      sku: true,
      codigoBarras: true,
      quantidadeEstoque: true,
      estoqueMinimo: true,
      precoVenda: true,
      status: true,
    },
    orderBy: { nome: "asc" },
  });

  const produtos: ProdutoItem[] = rows.map((p) => ({
    ...p,
    precoVenda: Number(p.precoVenda),
  }));

  return <ProdutosClient initialProdutos={produtos} />;
}

export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          Carregando produtos...
        </div>
      }
    >
      <ProdutosLoader />
    </Suspense>
  );
}

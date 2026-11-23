import { Suspense } from "react";
import { connection } from "next/server";
import {
  RelatoriosClient,
  type RelatorioProduto,
} from "@/components/RelatoriosClient";
import { requireAdminPageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function RelatoriosLoader() {
  await connection();
  await requireAdminPageAuth();
  const isAdmin = true;

  const rows = await prisma.produto.findMany({
    select: {
      id: true,
      nome: true,
      categoria: true,
      sku: true,
      quantidadeEstoque: true,
      estoqueMinimo: true,
      precoCusto: isAdmin,
      precoVenda: true,
      status: true,
    },
    orderBy: { nome: "asc" },
  });

  const produtos: RelatorioProduto[] = rows.map((p) => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    sku: p.sku,
    quantidadeEstoque: p.quantidadeEstoque,
    estoqueMinimo: p.estoqueMinimo,
    ...(isAdmin && "precoCusto" in p
      ? { precoCusto: Number(p.precoCusto) }
      : {}),
    precoVenda: Number(p.precoVenda),
    status: p.status,
  }));

  return <RelatoriosClient produtos={produtos} isAdmin={isAdmin} />;
}

export default function RelatoriosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          Carregando relatórios...
        </div>
      }
    >
      <RelatoriosLoader />
    </Suspense>
  );
}

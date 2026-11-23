import { Suspense } from "react";
import { connection } from "next/server";
import {
  HistoricoClient,
  type HistoricoItem,
} from "@/components/HistoricoClient";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function HistoricoLoader() {
  await connection();
  await requirePageAuth();

  const [movRows, produtos, responsaveis] = await Promise.all([
    prisma.movimentacao.findMany({
      select: {
        id: true,
        tipo: true,
        quantidade: true,
        motivoBaixa: true,
        observacao: true,
        criadoEm: true,
        produtoId: true,
        responsavelId: true,
        produto: { select: { nome: true } },
        responsavel: { select: { nome: true } },
      },
      orderBy: { criadoEm: "desc" },
      take: 200,
    }),
    prisma.produto.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.usuario.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const movimentacoes: HistoricoItem[] = movRows.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    quantidade: m.quantidade,
    motivoBaixa: m.motivoBaixa,
    observacao: m.observacao,
    criadoEm: m.criadoEm.toISOString(),
    produtoId: m.produtoId,
    produtoNome: m.produto.nome,
    responsavelId: m.responsavelId,
    responsavelNome: m.responsavel.nome,
  }));

  return (
    <HistoricoClient
      movimentacoes={movimentacoes}
      produtos={produtos}
      responsaveis={responsaveis}
    />
  );
}

export default function HistoricoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          Carregando histórico...
        </div>
      }
    >
      <HistoricoLoader />
    </Suspense>
  );
}

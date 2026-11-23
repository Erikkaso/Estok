import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  MotivoBaixa,
  PerfilUsuario,
  StatusProduto,
  TipoMovimentacao,
} from "@prisma/client";
import { requirePageAuth } from "@/lib/auth";
import {
  formatCurrencyCompactBRL,
  formatIntegerBR,
  formatTimeBR,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";

const MOTIVO_LABELS: Record<MotivoBaixa, string> = {
  PERDA: "Perda",
  AVARIA: "Avaria",
  EXTRAVIO: "Extravio",
  VENCIMENTO: "Vencimento",
  OUTRO: "Outro",
};

async function DashboardContent() {
  await connection();
  const user = await requirePageAuth();
  const isAdmin = user.perfil === PerfilUsuario.ADMIN;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [produtosAtivos, saidasMesAgg, saidasHojeAgg, movimentacoesRecentes] =
    await Promise.all([
      prisma.produto.findMany({
        where: { status: StatusProduto.ATIVO },
        select: {
          id: true,
          nome: true,
          quantidadeEstoque: true,
          estoqueMinimo: true,
          precoCusto: isAdmin,
        },
        orderBy: { quantidadeEstoque: "asc" },
      }),
      prisma.movimentacao.aggregate({
        where: {
          tipo: { in: [TipoMovimentacao.SAIDA, TipoMovimentacao.BAIXA] },
          criadoEm: { gte: startOfMonth },
        },
        _sum: { quantidade: true },
      }),
      prisma.movimentacao.aggregate({
        where: {
          tipo: { in: [TipoMovimentacao.SAIDA, TipoMovimentacao.BAIXA] },
          criadoEm: { gte: startOfToday },
        },
        _sum: { quantidade: true },
      }),
      prisma.movimentacao.findMany({
        select: {
          id: true,
          tipo: true,
          quantidade: true,
          motivoBaixa: true,
          criadoEm: true,
          produto: {
            select: { nome: true },
          },
        },
        orderBy: { criadoEm: "desc" },
        take: 5,
      }),
    ]);

  const produtosAbaixoMinimo = produtosAtivos.filter(
    (p) => p.quantidadeEstoque <= p.estoqueMinimo
  );
  const totalItens = produtosAtivos.reduce(
    (acc, p) => acc + p.quantidadeEstoque,
    0
  );
  const valorEstimado = isAdmin
    ? produtosAtivos.reduce(
        (acc, p) =>
          acc +
          p.quantidadeEstoque *
            Number("precoCusto" in p ? p.precoCusto : 0),
        0
      )
    : 0;

  const saidasMes = saidasMesAgg._sum.quantidade ?? 0;
  const saidasHoje = saidasHojeAgg._sum.quantidade ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral do seu estoque em tempo real.
          </p>
        </div>

        <Link
          href="/movimentacoes/entrada"
          className="inline-flex items-center justify-center rounded-lg bg-[#1F2937] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Registrar entrada
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Produtos ativos</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatIntegerBR(produtosAtivos.length)}
          </p>
          <p className="mt-1.5 text-xs font-medium text-amber-700">
            {produtosAbaixoMinimo.length} abaixo do mínimo
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Itens em estoque</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatIntegerBR(totalItens)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">unidades disponíveis</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Valor em estoque</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {isAdmin ? formatCurrencyCompactBRL(valorEstimado) : "Restrito"}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {isAdmin ? "custo estimado" : "disponível apenas para ADMIN"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Saídas no mês</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatIntegerBR(saidasMes)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">{saidasHoje} hoje</p>
        </div>
      </div>

      {/* Bottom 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Estoque mínimo</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {produtosAbaixoMinimo.length}{" "}
            {produtosAbaixoMinimo.length === 1
              ? "produto precisa de reposição"
              : "produtos precisam de reposição"}
          </p>

          <div className="mt-4 divide-y divide-slate-100">
            {produtosAbaixoMinimo.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                Todos os produtos ativos estão acima do estoque mínimo.
              </p>
            ) : (
              produtosAbaixoMinimo.slice(0, 6).map((produto) => (
                <Link
                  key={produto.id}
                  href={`/movimentacoes/entrada?produtoId=${produto.id}`}
                  className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-slate-50/70"
                >
                  <span className="font-medium text-slate-800">
                    {produto.nome}
                  </span>
                  <span className="font-semibold text-amber-700">
                    {produto.quantidadeEstoque} un.
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Movimentações recentes
            </h2>
            <Link
              href="/historico"
              className="text-xs font-medium text-[#1D4ED8] hover:underline"
            >
              Ver histórico
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {movimentacoesRecentes.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              movimentacoesRecentes.map((mov) => {
                const isEntrada = mov.tipo === TipoMovimentacao.ENTRADA;
                const isBaixa = mov.tipo === TipoMovimentacao.BAIXA;
                const tipoLabel = isEntrada
                  ? "Entrada"
                  : isBaixa
                    ? mov.motivoBaixa
                      ? `Baixa (${MOTIVO_LABELS[mov.motivoBaixa]})`
                      : "Baixa"
                    : "Saída";

                return (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {tipoLabel} • {mov.produto.nome}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimeBR(mov.criadoEm)}
                      </p>
                    </div>
                    <span
                      className={
                        isEntrada
                          ? "text-sm font-semibold text-emerald-600"
                          : isBaixa
                            ? "text-sm font-semibold text-amber-700"
                            : "text-sm font-semibold text-red-600"
                      }
                    >
                      {isEntrada ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          Carregando dashboard...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

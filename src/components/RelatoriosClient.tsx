"use client";

import { useMemo, useState } from "react";
import { formatCurrencyBRL } from "@/lib/format";
import { baixarCsv, csvLinha } from "@/lib/csv";
import { RelatorioMovimentacoes } from "@/components/RelatorioMovimentacoes";

export interface RelatorioProduto {
  id: string;
  nome: string;
  categoria: string;
  sku: string;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  precoCusto?: number;
  precoVenda: number;
  status: "ATIVO" | "INATIVO";
}

interface RelatoriosClientProps {
  produtos: RelatorioProduto[];
  isAdmin: boolean;
}

export function RelatoriosClient({
  produtos,
  isAdmin,
}: RelatoriosClientProps) {
  const [filtro, setFiltro] = useState("TODOS");

  const itens = useMemo(() => {
    return produtos.filter((p) => {
      if (filtro === "REPOSICAO") {
        return p.status === "ATIVO" && p.quantidadeEstoque <= p.estoqueMinimo;
      }
      if (filtro === "ATIVOS") return p.status === "ATIVO";
      if (filtro === "INATIVOS") return p.status === "INATIVO";
      return true;
    });
  }, [produtos, filtro]);

  function exportarCsv() {
    baixarCsv("relatorio-estoque-estok.csv", [
      csvLinha([
        "Produto",
        "Categoria",
        "SKU",
        "Estoque",
        "Estoque Minimo",
        ...(isAdmin ? ["Preco Custo"] : []),
        "Preco Venda",
        "Status",
      ]),
      ...itens.map((p) =>
        csvLinha([
          p.nome,
          p.categoria,
          p.sku,
          p.quantidadeEstoque,
          p.estoqueMinimo,
          ...(isAdmin ? [p.precoCusto ?? 0] : []),
          p.precoVenda,
          p.status,
        ])
      ),
    ]);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <RelatorioMovimentacoes />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Posição do estoque
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Posição consolidada do estoque, itens para reposição e exportação
            CSV.
          </p>
        </div>

        <button
          type="button"
          onClick={exportarCsv}
          className="inline-flex items-center justify-center rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#1E40AF] active:scale-[0.97]"
        >
          Exportar CSV
        </button>
      </div>

      <div className="print:hidden">
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Filtrar relatório"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="TODOS">Todos os produtos</option>
          <option value="REPOSICAO">Precisam de reposição</option>
          <option value="ATIVOS">Apenas ativos</option>
          <option value="INATIVOS">Apenas inativos</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Produto</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Estoque</th>
                <th className="px-5 py-3.5">Mínimo</th>
                {isAdmin && <th className="px-5 py-3.5">Custo total</th>}
                <th className="px-5 py-3.5">Preço venda</th>
                <th className="px-5 py-3.5">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itens.map((p) => {
                const reposicao =
                  p.status === "ATIVO" && p.quantidadeEstoque <= p.estoqueMinimo;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {p.nome}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{p.sku}</td>
                    <td className="px-5 py-4 text-slate-800">
                      {p.quantidadeEstoque}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {p.estoqueMinimo}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-4 text-slate-800">
                        {formatCurrencyBRL(
                          (p.precoCusto ?? 0) * p.quantidadeEstoque
                        )}
                      </td>
                    )}
                    <td className="px-5 py-4 text-slate-800">
                      {formatCurrencyBRL(p.precoVenda)}
                    </td>
                    <td
                      className={
                        p.status === "INATIVO"
                          ? "px-5 py-4 font-semibold text-slate-500"
                          : reposicao
                            ? "px-5 py-4 font-semibold text-amber-700"
                            : "px-5 py-4 font-semibold text-emerald-600"
                      }
                    >
                      {p.status === "INATIVO"
                        ? "Inativo"
                        : reposicao
                          ? "Reposição"
                          : "Regular"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatCurrencyBRL } from "@/lib/format";

export interface ProdutoItem {
  id: string;
  nome: string;
  categoria: string;
  sku: string;
  codigoBarras: string | null;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  precoVenda: number;
  status: "ATIVO" | "INATIVO";
}

interface ProdutosClientProps {
  initialProdutos: ProdutoItem[];
}

export function ProdutosClient({ initialProdutos }: ProdutosClientProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return initialProdutos.filter((p) => {
      if (statusFiltro === "ATIVO" && p.status !== "ATIVO") return false;
      if (statusFiltro === "INATIVO" && p.status !== "INATIVO") return false;
      if (
        statusFiltro === "BAIXO" &&
        !(p.status === "ATIVO" && p.quantidadeEstoque > 0 && p.quantidadeEstoque <= p.estoqueMinimo)
      ) {
        return false;
      }
      if (
        statusFiltro === "SEM_ESTOQUE" &&
        !(p.status === "ATIVO" && p.quantidadeEstoque === 0)
      ) {
        return false;
      }

      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.codigoBarras?.toLowerCase().includes(q) ?? false) ||
        p.categoria.toLowerCase().includes(q)
      );
    });
  }, [initialProdutos, busca, statusFiltro]);

  function getStockBadge(p: ProdutoItem) {
    if (p.status === "INATIVO") {
      return { label: "Inativo", className: "text-slate-500" };
    }
    if (p.quantidadeEstoque === 0) {
      return { label: "Sem estoque", className: "text-red-600" };
    }
    if (p.quantidadeEstoque <= p.estoqueMinimo) {
      return { label: "Baixo", className: "text-amber-700" };
    }
    return { label: "Normal", className: "text-emerald-600" };
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie cadastro, status, preços e níveis de estoque.
          </p>
        </div>

        <Link
          href="/produtos/novo"
          className="inline-flex items-center justify-center rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
        >
          + Novo produto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtrados.length === 1) {
              router.push(`/produtos/${filtrados[0].id}`);
            }
          }}
          placeholder="Buscar por nome, SKU ou código de barras..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 sm:max-w-md"
        />

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          aria-label="Filtrar por status"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="BAIXO">Estoque baixo</option>
          <option value="SEM_ESTOQUE">Sem estoque</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Produto</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Estoque</th>
                <th className="px-5 py-3.5">Mínimo</th>
                <th className="px-5 py-3.5">Preço venda</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtrados.map((produto) => {
                  const badge = getStockBadge(produto);
                  return (
                    <tr
                      key={produto.id}
                      onClick={() => router.push(`/produtos/${produto.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {produto.nome}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{produto.sku}</td>
                      <td className="px-5 py-4 text-slate-800">
                        {produto.quantidadeEstoque}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {produto.estoqueMinimo}
                      </td>
                      <td className="px-5 py-4 text-slate-800">
                        {formatCurrencyBRL(produto.precoVenda)}
                      </td>
                      <td className={`px-5 py-4 font-semibold ${badge.className}`}>
                        {badge.label}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

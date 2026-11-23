"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface ProdutoFormProps {
  mode: "create" | "edit";
  isAdmin: boolean;
  initialData?: {
    id: string;
    nome: string;
    descricao: string | null;
    categoria: string;
    sku: string;
    codigoBarras: string | null;
    estoqueMinimo: number;
    precoCusto?: number;
    precoVenda: number;
    status: "ATIVO" | "INATIVO";
    quantidadeEstoque: number;
  };
}

const CATEGORIAS_PADRAO = [
  "Periféricos",
  "Monitores",
  "Acessórios",
  "Áudio",
  "Alimentos",
  "Escritório",
  "Outros",
];

export function ProdutoForm({ mode, isAdmin, initialData }: ProdutoFormProps) {
  const router = useRouter();
  const [nome, setNome] = useState(initialData?.nome ?? "");
  const [categoria, setCategoria] = useState(initialData?.categoria ?? "");
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const [codigoBarras, setCodigoBarras] = useState(
    initialData?.codigoBarras ?? ""
  );
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    initialData ? String(initialData.estoqueMinimo) : "10"
  );
  const [precoCusto, setPrecoCusto] = useState(
    initialData?.precoCusto !== undefined ? String(initialData.precoCusto) : ""
  );
  const [precoVenda, setPrecoVenda] = useState(
    initialData ? String(initialData.precoVenda) : ""
  );
  const [ativo, setAtivo] = useState(
    initialData ? initialData.status === "ATIVO" : true
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const categoriasDisponiveis = Array.from(
    new Set([
      ...CATEGORIAS_PADRAO,
      ...(initialData?.categoria ? [initialData.categoria] : []),
    ])
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const payload = {
        nome,
        categoria,
        sku,
        codigoBarras: codigoBarras || null,
        estoqueMinimo: Number(estoqueMinimo || 0),
        precoVenda: Number(String(precoVenda || "0").replace(",", ".")),
        ...(isAdmin
          ? {
              precoCusto: Number(
                String(precoCusto || "0").replace(",", ".")
              ),
            }
          : {}),
        status: ativo ? "ATIVO" : "INATIVO",
      };

      const url =
        mode === "create"
          ? "/api/produtos"
          : `/api/produtos/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Erro ao salvar produto.");
        return;
      }

      router.push("/produtos");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {mode === "create" ? "Novo produto" : "Editar produto"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "create"
            ? "Cadastre os dados necessários para controlar o item no estoque."
            : "Atualize os dados do item. Alterar preços não altera a quantidade física em estoque."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        {erro && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-base font-bold text-slate-900">
              Informações do produto
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-xs font-medium text-slate-700"
                >
                  Nome / descrição *
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  placeholder="Ex.: Café Tradicional 500g"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="categoria"
                  className="block text-xs font-medium text-slate-700"
                >
                  Categoria *
                </label>
                <select
                  id="categoria"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasDisponiveis.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="sku"
                  className="block text-xs font-medium text-slate-700"
                >
                  SKU *
                </label>
                <input
                  id="sku"
                  type="text"
                  required
                  placeholder="CAF-500"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="codigoBarras"
                  className="block text-xs font-medium text-slate-700"
                >
                  Código de barras
                </label>
                <input
                  id="codigoBarras"
                  type="text"
                  placeholder="7890000000000"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="estoqueMinimo"
                  className="block text-xs font-medium text-slate-700"
                >
                  Estoque mínimo *
                </label>
                <input
                  id="estoqueMinimo"
                  type="number"
                  min={0}
                  required
                  placeholder="10"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900">Precificação</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {isAdmin && (
                <div>
                  <label
                    htmlFor="precoCusto"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Preço de custo
                  </label>
                  <input
                    id="precoCusto"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="R$ 0,00"
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="precoVenda"
                  className="block text-xs font-medium text-slate-700"
                >
                  Preço de venda
                </label>
                <input
                  id="precoVenda"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  placeholder="R$ 0,00"
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>
            </div>

            {mode === "edit" && initialData && (
              <p className="mt-3 text-xs text-slate-500">
                Saldo físico atual em estoque:{" "}
                <span className="font-semibold text-slate-800">
                  {initialData.quantidadeEstoque} unidades
                </span>{" "}
                (alterável apenas via Movimentações).
              </p>
            )}
          </section>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              onClick={() => setAtivo((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                ativo ? "bg-[#1D4ED8]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ativo ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-slate-800">
              Produto ativo
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/produtos"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

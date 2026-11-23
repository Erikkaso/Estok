"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { MovimentacaoTabs } from "@/components/MovimentacaoTabs";

export interface MovProdutoOption {
  id: string;
  nome: string;
  categoria: string;
  sku: string;
  codigoBarras: string | null;
  quantidadeEstoque: number;
}

interface MovimentacaoFormProps {
  tipo: "ENTRADA" | "SAIDA" | "BAIXA";
  produtos: MovProdutoOption[];
  initialProdutoId?: string;
}

const MOTIVOS = [
  { value: "AVARIA", label: "Avaria" },
  { value: "PERDA", label: "Perda" },
  { value: "EXTRAVIO", label: "Extravio" },
  { value: "VENCIMENTO", label: "Vencimento" },
  { value: "OUTRO", label: "Outro" },
];

export function MovimentacaoForm({
  tipo,
  produtos,
  initialProdutoId,
}: MovimentacaoFormProps) {
  const router = useRouter();
  const initialSelected =
    produtos.find((p) => p.id === initialProdutoId) ?? produtos[0] ?? null;

  const [busca, setBusca] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>(
    initialSelected?.id ?? ""
  );
  const [quantidade, setQuantidade] = useState(
    tipo === "BAIXA" ? "2" : ""
  );
  const [motivoBaixa, setMotivoBaixa] = useState("AVARIA");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const produtoAtual = useMemo(
    () => produtos.find((p) => p.id === produtoSelecionadoId) ?? null,
    [produtos, produtoSelecionadoId]
  );

  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return produtos.slice(0, 8);
    return produtos
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.codigoBarras?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 8);
  }, [produtos, busca]);

  const qtdNumero = Number(quantidade);
  const qtdValida = Number.isInteger(qtdNumero) && qtdNumero > 0;

  const novoSaldo = useMemo(() => {
    if (!produtoAtual) return 0;
    if (!qtdValida) return produtoAtual.quantidadeEstoque;
    return tipo === "ENTRADA"
      ? produtoAtual.quantidadeEstoque + qtdNumero
      : produtoAtual.quantidadeEstoque - qtdNumero;
  }, [produtoAtual, qtdNumero, qtdValida, tipo]);

  const excedeSaldo =
    (tipo === "SAIDA" || tipo === "BAIXA") &&
    produtoAtual !== null &&
    qtdValida &&
    qtdNumero > produtoAtual.quantidadeEstoque;

  function selecionarProduto(produto: MovProdutoOption) {
    setProdutoSelecionadoId(produto.id);
    setBusca("");
    setDropdownAberto(false);
    setErro(null);
  }

  function handleBuscaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = busca.trim().toLowerCase();
      if (!q) return;
      const exato = produtos.find(
        (p) =>
          p.codigoBarras?.toLowerCase() === q ||
          p.sku.toLowerCase() === q
      );
      if (exato) {
        selecionarProduto(exato);
      } else if (sugestoes.length === 1) {
        selecionarProduto(sugestoes[0]);
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!produtoAtual) {
      setErro("Selecione um produto ativo.");
      return;
    }

    if (!qtdValida) {
      setErro("Informe uma quantidade inteira maior que zero.");
      return;
    }

    if (excedeSaldo) {
      setErro(
        `Quantidade (${qtdNumero}) excede o saldo disponível (${produtoAtual.quantidadeEstoque}).`
      );
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/movimentacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: produtoAtual.id,
          tipo,
          quantidade: qtdNumero,
          ...(tipo === "BAIXA" ? { motivoBaixa } : {}),
          observacao: observacao.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível registrar a movimentação.");
        return;
      }

      setSucesso(
        `Movimentação registrada! Novo saldo de ${produtoAtual.nome}: ${data.movimentacao.saldoPosterior} unidades.`
      );
      setQuantidade("");
      setObservacao("");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao registrar movimentação.");
    } finally {
      setSalvando(false);
    }
  }

  const headerInfo = {
    ENTRADA: {
      title: "Registrar entrada",
      subtitle: "Adicione mercadorias ao saldo do estoque.",
      button: "Confirmar entrada",
    },
    SAIDA: {
      title: "Registrar saída",
      subtitle:
        "Retire mercadorias mantendo o saldo e o histórico sincronizados.",
      button: "Confirmar saída",
    },
    BAIXA: {
      title: "Registrar baixa",
      subtitle:
        "Registre perdas, avarias ou extravios separadamente das saídas normais.",
      button: "Confirmar baixa",
    },
  }[tipo];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {headerInfo.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{headerInfo.subtitle}</p>
        </div>

        <MovimentacaoTabs />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7"
      >
        {erro && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
            {sucesso}
          </div>
        )}

        <div className="space-y-5">
          {/* Product lookup / barcode */}
          <div className="relative">
            <label
              htmlFor="busca-produto"
              className="block text-xs font-medium text-slate-700"
            >
              {tipo === "BAIXA" ? "Produto *" : "Produto"}
            </label>
            <input
              id="busca-produto"
              type="text"
              value={busca}
              onFocus={() => setDropdownAberto(true)}
              onBlur={() => setTimeout(() => setDropdownAberto(false), 150)}
              onChange={(e) => {
                setBusca(e.target.value);
                setDropdownAberto(true);
              }}
              onKeyDown={handleBuscaKeyDown}
              placeholder={
                tipo === "BAIXA"
                  ? "Buscar por nome, SKU ou código de barras..."
                  : "Buscar por nome, SKU ou ler código de barras..."
              }
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
            />

            {dropdownAberto && sugestoes.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {sugestoes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => selecionarProduto(item)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.nome}</p>
                      <p className="text-xs text-slate-500">
                        {item.sku}
                        {item.codigoBarras ? ` · ${item.codigoBarras}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {item.quantidadeEstoque} un.
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected product summary card */}
          {produtoAtual ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3.5">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {produtoAtual.nome}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  SKU {produtoAtual.sku} • Categoria: {produtoAtual.categoria}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-slate-500">
                  {tipo === "SAIDA" ? "Saldo disponível" : "Saldo atual"}
                </p>
                <p
                  className={
                    tipo === "ENTRADA" && produtoAtual.quantidadeEstoque <= 5
                      ? "text-sm font-bold text-amber-700"
                      : "text-sm font-bold text-emerald-600"
                  }
                >
                  {produtoAtual.quantidadeEstoque} unidades
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500">
              Nenhum produto ativo selecionado.
            </p>
          )}

          {/* Fields by movement type */}
          {tipo === "ENTRADA" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="quantidade"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Quantidade *
                  </label>
                  <input
                    id="quantidade"
                    type="number"
                    min={1}
                    required
                    placeholder="Ex.: 20"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="observacao"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Referência / observação
                  </label>
                  <input
                    id="observacao"
                    type="text"
                    placeholder="Nota fiscal, fornecedor ou observação"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              </div>

              {produtoAtual && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-100/80 px-4 py-3 text-sm font-semibold text-emerald-800">
                  <span>Novo saldo após confirmação</span>
                  <span>{novoSaldo} unidades</span>
                </div>
              )}
            </>
          )}

          {tipo === "SAIDA" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="quantidade"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Quantidade de saída *
                  </label>
                  <input
                    id="quantidade"
                    type="number"
                    min={1}
                    required
                    placeholder="Ex.: 8"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="observacao"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Observação (opcional)
                  </label>
                  <input
                    id="observacao"
                    type="text"
                    placeholder="Ex.: Pedido #104 ou setor destino"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              </div>

              {produtoAtual && (
                <div
                  className={
                    excedeSaldo
                      ? "flex items-center justify-between rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-800"
                      : "flex items-center justify-between rounded-lg bg-sky-100/80 px-4 py-3 text-sm font-semibold text-sky-900"
                  }
                >
                  <span>Saldo após confirmação</span>
                  <span>
                    {excedeSaldo
                      ? `Saldo insuficiente (${novoSaldo} unidades)`
                      : `${novoSaldo} unidades`}
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-500">
                O sistema bloqueará a operação caso a quantidade seja maior que
                o saldo disponível.
              </p>
            </>
          )}

          {tipo === "BAIXA" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="motivo"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Motivo *
                  </label>
                  <select
                    id="motivo"
                    value={motivoBaixa}
                    onChange={(e) => setMotivoBaixa(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  >
                    {MOTIVOS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quantidade"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Quantidade *
                  </label>
                  <input
                    id="quantidade"
                    type="number"
                    min={1}
                    required
                    placeholder="Ex.: 2"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="observacao"
                  className="block text-xs font-medium text-slate-700"
                >
                  Observação
                </label>
                <input
                  id="observacao"
                  type="text"
                  placeholder="Ex.: embalagem danificada durante armazenamento"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div className="rounded-lg bg-amber-100/80 px-4 py-3.5 text-xs text-amber-900">
                <p className="font-bold">
                  Atenção: esta operação reduzirá o saldo do produto.
                </p>
                <p className="mt-0.5">
                  A baixa ficará registrada no histórico com motivo, usuário e
                  data/hora.
                  {produtoAtual && qtdValida
                    ? ` Saldo previsto: ${novoSaldo} unidades.`
                    : ""}
                </p>
              </div>
            </>
          )}

          <div>
            <button
              type="submit"
              disabled={salvando || !produtoAtual || excedeSaldo}
              className={
                tipo === "BAIXA"
                  ? "rounded-lg bg-[#B45309] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] disabled:opacity-60"
                  : "rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
              }
            >
              {salvando ? "Registrando..." : headerInfo.button}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

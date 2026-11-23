"use client";

import { useMemo, useState } from "react";
import { formatDateTimeBulletBR } from "@/lib/format";

export interface HistoricoItem {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "BAIXA";
  quantidade: number;
  motivoBaixa: "PERDA" | "AVARIA" | "EXTRAVIO" | "VENCIMENTO" | "OUTRO" | null;
  observacao: string | null;
  criadoEm: string;
  produtoId: string;
  produtoNome: string;
  responsavelId: string;
  responsavelNome: string;
}

interface OptionItem {
  id: string;
  nome: string;
}

interface HistoricoClientProps {
  movimentacoes: HistoricoItem[];
  produtos: OptionItem[];
  responsaveis: OptionItem[];
}

const MOTIVO_LABELS: Record<string, string> = {
  PERDA: "Perda",
  AVARIA: "Avaria",
  EXTRAVIO: "Extravio",
  VENCIMENTO: "Vencimento",
  OUTRO: "Outro",
};

export function HistoricoClient({
  movimentacoes,
  produtos,
  responsaveis,
}: HistoricoClientProps) {
  const [periodo, setPeriodo] = useState("TODOS");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [responsavelId, setResponsavelId] = useState("");

  const filtradas = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return movimentacoes.filter((m) => {
      if (produtoId && m.produtoId !== produtoId) return false;
      if (tipo && m.tipo !== tipo) return false;
      if (responsavelId && m.responsavelId !== responsavelId) return false;

      const dt = new Date(m.criadoEm);
      if (periodo === "HOJE" && dt < startOfToday) return false;
      if (periodo === "7D") {
        const d7 = new Date(startOfToday);
        d7.setDate(d7.getDate() - 7);
        if (dt < d7) return false;
      }
      if (periodo === "30D") {
        const d30 = new Date(startOfToday);
        d30.setDate(d30.getDate() - 30);
        if (dt < d30) return false;
      }
      if (periodo === "CUSTOM") {
        if (dataInicio) {
          const s = new Date(`${dataInicio}T00:00:00`);
          if (dt < s) return false;
        }
        if (dataFim) {
          const e = new Date(`${dataFim}T23:59:59`);
          if (dt > e) return false;
        }
      }

      return true;
    });
  }, [
    movimentacoes,
    periodo,
    dataInicio,
    dataFim,
    produtoId,
    tipo,
    responsavelId,
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Histórico de movimentações
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Rastreie entradas, saídas e baixas com data, responsável e detalhes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          aria-label="Filtrar por período"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="TODOS">Todos os períodos</option>
          <option value="HOJE">Hoje</option>
          <option value="7D">Últimos 7 dias</option>
          <option value="30D">Últimos 30 dias</option>
          <option value="CUSTOM">Período personalizado</option>
        </select>

        {periodo === "CUSTOM" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              aria-label="Data inicial"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#1D4ED8] focus:outline-none"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              aria-label="Data final"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>
        )}

        <select
          value={produtoId}
          onChange={(e) => setProdutoId(e.target.value)}
          aria-label="Filtrar por produto"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="">Todos os produtos</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          aria-label="Filtrar por tipo"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="">Todos os tipos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA">Saída</option>
          <option value="BAIXA">Baixa</option>
        </select>

        <select
          value={responsavelId}
          onChange={(e) => setResponsavelId(e.target.value)}
          aria-label="Filtrar por responsável"
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
        >
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Data/hora</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Produto</th>
                <th className="px-5 py-3.5">Qtd.</th>
                <th className="px-5 py-3.5">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-slate-500"
                  >
                    Nenhuma movimentação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtradas.map((mov) => {
                  const isEntrada = mov.tipo === "ENTRADA";
                  const isBaixa = mov.tipo === "BAIXA";
                  const tipoTexto = isEntrada
                    ? "Entrada"
                    : isBaixa
                      ? mov.motivoBaixa
                        ? `Baixa • ${MOTIVO_LABELS[mov.motivoBaixa]}`
                        : "Baixa"
                      : "Saída";

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-slate-600">
                        {formatDateTimeBulletBR(mov.criadoEm)}
                      </td>
                      <td
                        className={
                          isEntrada
                            ? "px-5 py-4 font-semibold text-emerald-600"
                            : isBaixa
                              ? "px-5 py-4 font-semibold text-amber-700"
                              : "px-5 py-4 font-semibold text-red-600"
                        }
                      >
                        {tipoTexto}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {mov.produtoNome}
                        </p>
                        {mov.observacao && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {mov.observacao}
                          </p>
                        )}
                      </td>
                      <td
                        className={
                          isEntrada
                            ? "px-5 py-4 font-semibold text-emerald-600"
                            : "px-5 py-4 font-semibold text-red-600"
                        }
                      >
                        {isEntrada ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {mov.responsavelNome}
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

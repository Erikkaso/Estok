"use client";

import { useEffect, useState } from "react";
import { baixarCsv, csvLinha } from "@/lib/csv";
import type { Consolidado } from "@/lib/relatorios";
import { formatCurrencyBRL, formatIntegerBR } from "@/lib/format";

const MOTIVOS: Record<string, string> = {
  PERDA: "Perda",
  AVARIA: "Avaria",
  EXTRAVIO: "Extravio",
  VENCIMENTO: "Vencimento",
  OUTRO: "Outro",
};

const BR_OFFSET = 3 * 3600_000;
const hojeISO = () => new Date(Date.now() - BR_OFFSET).toISOString().slice(0, 10);
const diasAtrasISO = (n: number) =>
  new Date(Date.now() - BR_OFFSET - n * 86_400_000).toISOString().slice(0, 10);
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dmy = (iso: string) => `${dm(iso)}/${iso.slice(0, 4)}`;

const INPUT_DATA =
  "mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20";

export function RelatorioMovimentacoes() {
  const [inicio, setInicio] = useState(() => diasAtrasISO(29));
  const [fim, setFim] = useState(() => hojeISO());
  const [dados, setDados] = useState<Consolidado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/relatorios?inicio=${inicio}&fim=${fim}`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error ?? "Erro ao gerar relatório.");
        setErro(null);
        setDados(j.consolidado);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setErro(e.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setCarregando(false);
      });
    return () => ctrl.abort();
  }, [inicio, fim]);

  function mudarPeriodo(set: (v: string) => void, valor: string) {
    if (!valor) return;
    setCarregando(true);
    set(valor);
  }

  function exportarCsv() {
    if (!dados) return;
    baixarCsv(`relatorio-movimentacoes-${dados.inicio}_${dados.fim}.csv`, [
      csvLinha(["Periodo", `${dados.inicio} a ${dados.fim}`]),
      csvLinha(["Entradas (un)", dados.entradas]),
      csvLinha(["Saidas (un)", dados.saidas]),
      csvLinha(["Baixas (un)", dados.baixas]),
      csvLinha(["Faturamento estimado", dados.faturamento]),
      csvLinha(["Custo das saidas", dados.custoSaidas]),
      csvLinha(["Custo das perdas", dados.custoPerdas]),
      csvLinha(["Giro do estoque", Number(dados.giro.toFixed(2))]),
      "",
      csvLinha(["Dia", "Entradas", "Saidas", "Baixas"]),
      ...dados.serie.map((d) => csvLinha([d.dia, d.entradas, d.saidas, d.baixas])),
      "",
      csvLinha(["Produto", "Saidas", "Faturamento"]),
      ...dados.topProdutos.map((p) => csvLinha([p.nome, p.saidas, p.faturamento])),
      "",
      csvLinha(["Motivo da baixa", "Quantidade"]),
      ...dados.baixasPorMotivo.map((m) =>
        csvLinha([MOTIVOS[m.motivo] ?? m.motivo, m.quantidade])
      ),
    ]);
  }

  const maxDia = Math.max(
    1,
    ...(dados?.serie.map((d) => Math.max(d.entradas, d.saidas, d.baixas)) ?? [])
  );
  const funil = dados
    ? [
        { label: "Entradas", valor: dados.entradas, cor: "bg-[#1D4ED8]" },
        { label: "Saídas", valor: dados.saidas, cor: "bg-emerald-600" },
        { label: "Baixas", valor: dados.baixas, cor: "bg-amber-600" },
      ]
    : [];
  const maxFunil = Math.max(1, ...funil.map((f) => f.valor));
  const maxMotivo = Math.max(
    1,
    ...(dados?.baixasPorMotivo.map((m) => m.quantidade) ?? [1])
  );

  const kpis = dados
    ? [
        ["Entradas", `${formatIntegerBR(dados.entradas)} un`],
        ["Saídas", `${formatIntegerBR(dados.saidas)} un`],
        ["Baixas", `${formatIntegerBR(dados.baixas)} un`],
        ["Giro do estoque", `${dados.giro.toFixed(2).replace(".", ",")}x`],
        ["Faturamento estimado", formatCurrencyBRL(dados.faturamento)],
        ["Custo das saídas", formatCurrencyBRL(dados.custoSaidas)],
        ["Custo das perdas", formatCurrencyBRL(dados.custoPerdas)],
        ["Margem bruta", formatCurrencyBRL(dados.faturamento - dados.custoSaidas)],
      ]
    : [];

  return (
    <section className="space-y-5" aria-labelledby="rel-mov">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            id="rel-mov"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Relatórios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dados
              ? `Movimentações de ${dmy(dados.inicio)} a ${dmy(dados.fim)}`
              : "Movimentações por período"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <label className="text-xs font-medium text-slate-600">
            De
            <input
              type="date"
              value={inicio}
              max={fim}
              onChange={(e) => mudarPeriodo(setInicio, e.target.value)}
              className={INPUT_DATA}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Até
            <input
              type="date"
              value={fim}
              min={inicio}
              onChange={(e) => mudarPeriodo(setFim, e.target.value)}
              className={INPUT_DATA}
            />
          </label>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={!dados || carregando}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-[background-color,transform] duration-150 hover:bg-slate-50 active:scale-[0.97] disabled:opacity-50"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!dados || carregando}
            className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#1E40AF] active:scale-[0.97] disabled:opacity-50"
          >
            PDF
          </button>
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {erro}
        </p>
      )}

      <div
        className={`space-y-5 transition-opacity duration-200 ${carregando ? "opacity-60" : "opacity-100"}`}
        aria-busy={carregando}
      >
        {dados && (
          <>
            <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map(([k, v]) => (
                <div
                  key={k}
                  className="lift rounded-xl border border-slate-200 bg-white p-5"
                >
                  <p className="text-xs font-medium text-slate-500">{k}</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{v}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Movimento diário
                </h2>
                <div className="mt-3 flex gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-sm bg-[#1D4ED8]" />
                    Entradas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                    Saídas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-sm bg-amber-600" />
                    Baixas
                  </span>
                </div>
                <div
                  className="mt-4 flex h-44 items-end gap-px"
                  role="img"
                  aria-label={`Gráfico de movimentações diárias de ${dmy(dados.inicio)} a ${dmy(dados.fim)}`}
                >
                  {dados.serie.map((d) => (
                    <div
                      key={d.dia}
                      title={`${dmy(d.dia)} — entradas ${d.entradas}, saídas ${d.saidas}, baixas ${d.baixas}`}
                      className="flex h-full min-w-px flex-1 items-end justify-center gap-px"
                    >
                      {(
                        [
                          [d.entradas, "bg-[#1D4ED8]"],
                          [d.saidas, "bg-emerald-600"],
                          [d.baixas, "bg-amber-600"],
                        ] as const
                      ).map(([v, cor]) => (
                        <span
                          key={cor}
                          className={`bar-grow w-full max-w-2 rounded-t-sm ${cor}`}
                          style={{
                            height: `${(v / maxDia) * 100}%`,
                            minHeight: v > 0 ? 2 : 0,
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>{dm(dados.inicio)}</span>
                  <span>{dm(dados.fim)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">
                  Funil de saída
                </h2>
                <ul className="mt-4 space-y-4">
                  {funil.map((f) => (
                    <li key={f.label}>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>{f.label}</span>
                        <span className="font-semibold text-slate-900">
                          {formatIntegerBR(f.valor)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 rounded-full bg-slate-100">
                        <div
                          className={`bar-grow-x h-full rounded-full ${f.cor}`}
                          style={{ width: `${(f.valor / maxFunil) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">
                  Produtos mais vendidos
                </h2>
                {dados.topProdutos.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Sem saídas no período.
                  </p>
                ) : (
                  <ol className="mt-3 divide-y divide-slate-100 text-sm">
                    {dados.topProdutos.map((p) => (
                      <li
                        key={p.produtoId}
                        className="flex justify-between gap-3 py-2.5"
                      >
                        <span className="truncate text-slate-800">{p.nome}</span>
                        <span className="shrink-0 text-slate-600">
                          {formatIntegerBR(p.saidas)} un ·{" "}
                          {formatCurrencyBRL(p.faturamento)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-bold text-slate-900">
                  Baixas por motivo
                </h2>
                {dados.baixasPorMotivo.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Sem baixas no período.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {dados.baixasPorMotivo.map((m) => (
                      <li key={m.motivo}>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>{MOTIVOS[m.motivo] ?? m.motivo}</span>
                          <span className="font-semibold text-slate-900">
                            {m.quantidade}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                          <div
                            className="bar-grow-x h-full rounded-full bg-amber-600"
                            style={{
                              width: `${(m.quantidade / maxMotivo) * 100}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Faturamento e custos usam os preços atuais dos produtos. Giro =
              saídas do período ÷ estoque atual dos itens ativos.
            </p>
          </>
        )}
        {!dados && carregando && (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        )}
      </div>
    </section>
  );
}

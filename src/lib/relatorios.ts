// ponytail: datas em America/Sao_Paulo fixo (UTC-3, sem horário de verão desde 2019).
// Para multi-fuso, receber o offset do usuário.
const BR_OFFSET_MS = -3 * 3600_000;
const DIA_MS = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function diaBR(d: Date): string {
  return new Date(d.getTime() + BR_OFFSET_MS).toISOString().slice(0, 10);
}

export interface Intervalo {
  inicioStr: string;
  fimStr: string;
  inicio: Date;
  fim: Date;
}

/** Valida período (YYYY-MM-DD). Padrão: últimos 30 dias. Máx. 366 dias. null se inválido. */
export function intervaloBR(
  inicio?: string | null,
  fim?: string | null,
  agora = new Date()
): Intervalo | null {
  const fimStr = fim && ISO.test(fim) ? fim : diaBR(agora);
  const inicioStr =
    inicio && ISO.test(inicio)
      ? inicio
      : diaBR(new Date(Date.parse(`${fimStr}T12:00:00Z`) - 29 * DIA_MS));
  const ini = new Date(`${inicioStr}T00:00:00-03:00`);
  const end = new Date(`${fimStr}T23:59:59.999-03:00`);
  if (
    Number.isNaN(ini.getTime()) ||
    Number.isNaN(end.getTime()) ||
    ini > end ||
    end.getTime() - ini.getTime() > 366 * DIA_MS
  ) {
    return null;
  }
  return { inicioStr, fimStr, inicio: ini, fim: end };
}

export interface MovRelatorio {
  tipo: "ENTRADA" | "SAIDA" | "BAIXA";
  quantidade: number;
  motivoBaixa: string | null;
  criadoEm: Date;
  produtoId: string;
  produtoNome: string;
  precoVenda: number;
  precoCusto: number;
}

export interface DiaSerie {
  dia: string;
  entradas: number;
  saidas: number;
  baixas: number;
}

export interface Consolidado {
  inicio: string;
  fim: string;
  entradas: number;
  saidas: number;
  baixas: number;
  /** ponytail: usa o preço de venda ATUAL; o schema não guarda preço por movimentação. */
  faturamento: number;
  custoSaidas: number;
  custoPerdas: number;
  /** saídas do período / estoque atual (itens ativos). */
  giro: number;
  serie: DiaSerie[];
  baixasPorMotivo: { motivo: string; quantidade: number }[];
  topProdutos: { produtoId: string; nome: string; saidas: number; faturamento: number }[];
}

export function consolidar(
  movs: MovRelatorio[],
  estoqueAtual: number,
  inicioStr: string,
  fimStr: string
): Consolidado {
  const serieMap = new Map<string, DiaSerie>();
  for (
    let t = Date.parse(`${inicioStr}T12:00:00Z`);
    t <= Date.parse(`${fimStr}T12:00:00Z`);
    t += DIA_MS
  ) {
    const dia = new Date(t).toISOString().slice(0, 10);
    serieMap.set(dia, { dia, entradas: 0, saidas: 0, baixas: 0 });
  }

  const motivos = new Map<string, number>();
  const produtos = new Map<string, Consolidado["topProdutos"][number]>();
  const r = {
    entradas: 0,
    saidas: 0,
    baixas: 0,
    faturamento: 0,
    custoSaidas: 0,
    custoPerdas: 0,
  };

  for (const m of movs) {
    const dia = serieMap.get(diaBR(m.criadoEm));
    if (m.tipo === "ENTRADA") {
      r.entradas += m.quantidade;
      if (dia) dia.entradas += m.quantidade;
    } else if (m.tipo === "SAIDA") {
      r.saidas += m.quantidade;
      r.faturamento += m.quantidade * m.precoVenda;
      r.custoSaidas += m.quantidade * m.precoCusto;
      if (dia) dia.saidas += m.quantidade;
      const p = produtos.get(m.produtoId) ?? {
        produtoId: m.produtoId,
        nome: m.produtoNome,
        saidas: 0,
        faturamento: 0,
      };
      p.saidas += m.quantidade;
      p.faturamento += m.quantidade * m.precoVenda;
      produtos.set(m.produtoId, p);
    } else {
      r.baixas += m.quantidade;
      r.custoPerdas += m.quantidade * m.precoCusto;
      if (dia) dia.baixas += m.quantidade;
      const k = m.motivoBaixa ?? "OUTRO";
      motivos.set(k, (motivos.get(k) ?? 0) + m.quantidade);
    }
  }

  return {
    inicio: inicioStr,
    fim: fimStr,
    ...r,
    giro: estoqueAtual > 0 ? r.saidas / estoqueAtual : 0,
    serie: [...serieMap.values()],
    baixasPorMotivo: [...motivos]
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
    topProdutos: [...produtos.values()]
      .sort((a, b) => b.saidas - a.saidas)
      .slice(0, 5),
  };
}

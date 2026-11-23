import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularSaldo } from "../src/lib/estoque";
import { csvCelula } from "../src/lib/csv";
import { consolidar, intervaloBR } from "../src/lib/relatorios";

test("entrada soma ao saldo", () => {
  assert.deepEqual(calcularSaldo("ENTRADA", 10, 5), { ok: true, saldoPosterior: 15 });
});

test("saída e baixa subtraem", () => {
  assert.deepEqual(calcularSaldo("SAIDA", 10, 4), { ok: true, saldoPosterior: 6 });
  assert.deepEqual(calcularSaldo("BAIXA", 10, 10), { ok: true, saldoPosterior: 0 });
});

test("saída nunca deixa saldo negativo", () => {
  assert.equal(calcularSaldo("SAIDA", 3, 4).ok, false);
  assert.equal(calcularSaldo("BAIXA", 0, 1).ok, false);
});

test("quantidade nula, negativa ou fracionária é bloqueada", () => {
  for (const q of [0, -1, 1.5, NaN]) {
    assert.equal(calcularSaldo("ENTRADA", 10, q).ok, false);
  }
});

test("CSV escapa aspas/ponto e vírgula e neutraliza fórmulas", () => {
  assert.equal(csvCelula('a "b"; c'), '"a ""b""; c"');
  assert.equal(csvCelula("=1+1"), "'=1+1");
  assert.equal(csvCelula(1.5), "1,5");
});

test("intervalo: padrão 30 dias, rejeita invertido e > 366 dias", () => {
  const agora = new Date("2026-11-23T15:00:00Z");
  const i = intervaloBR(null, null, agora)!;
  assert.equal(i.fimStr, "2026-11-23");
  assert.equal(i.inicioStr, "2026-10-25");
  assert.equal(intervaloBR("2026-11-23", "2026-11-01", agora), null);
  assert.equal(intervaloBR("2024-01-01", "2026-01-01", agora), null);
});

test("consolidado soma tipos, faturamento, giro e série diária", () => {
  const base = { motivoBaixa: null, produtoId: "p1", produtoNome: "A", precoVenda: 10, precoCusto: 6 };
  const c = consolidar(
    [
      { ...base, tipo: "ENTRADA", quantidade: 20, criadoEm: new Date("2026-11-01T12:00:00Z") },
      { ...base, tipo: "SAIDA", quantidade: 5, criadoEm: new Date("2026-11-02T12:00:00Z") },
      { ...base, tipo: "BAIXA", quantidade: 2, motivoBaixa: "AVARIA", criadoEm: new Date("2026-11-02T13:00:00Z") },
    ],
    50,
    "2026-11-01",
    "2026-11-03"
  );
  assert.equal(c.entradas, 20);
  assert.equal(c.saidas, 5);
  assert.equal(c.faturamento, 50);
  assert.equal(c.custoPerdas, 12);
  assert.equal(c.giro, 0.1);
  assert.equal(c.serie.length, 3);
  assert.deepEqual(c.baixasPorMotivo, [{ motivo: "AVARIA", quantidade: 2 }]);
});

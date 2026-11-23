export type TipoMov = "ENTRADA" | "SAIDA" | "BAIXA";

export type ResultadoSaldo =
  | { ok: true; saldoPosterior: number }
  | { ok: false; error: string };

/** Regra única de saldo: entrada soma; saída e baixa subtraem e nunca ficam negativas. */
export function calcularSaldo(
  tipo: TipoMov,
  saldoAtual: number,
  quantidade: number
): ResultadoSaldo {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { ok: false, error: "A quantidade deve ser um número inteiro maior que zero." };
  }
  if (tipo === "ENTRADA") return { ok: true, saldoPosterior: saldoAtual + quantidade };
  if (quantidade > saldoAtual) {
    return {
      ok: false,
      error: `Quantidade (${quantidade}) excede o saldo disponível (${saldoAtual}).`,
    };
  }
  return { ok: true, saldoPosterior: saldoAtual - quantidade };
}

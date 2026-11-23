/** Escapa célula CSV e neutraliza injeção de fórmula (=, +, -, @) ao abrir no Excel. */
export function csvCelula(valor: string | number): string {
  let s = typeof valor === "number" ? String(valor).replace(".", ",") : valor;
  if (typeof valor === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvLinha(celulas: (string | number)[]): string {
  return celulas.map(csvCelula).join(";");
}

export function baixarCsv(nome: string, linhas: string[]) {
  const blob = new Blob(["\uFEFF" + linhas.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

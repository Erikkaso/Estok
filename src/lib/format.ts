export function formatCurrencyBRL(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatCurrencyCompactBRL(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "R$ 0";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatIntegerBR(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDateTimeBulletBR(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} • ${hours}:${minutes}`;
}

export function formatTimeBR(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatRelativeAccessBR(
  dateInput: Date | string | null | undefined
): string {
  if (!dateInput) return "Nunca acessou";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const time = formatTimeBR(date);

  if (diffDays === 0) return `Hoje • ${time}`;
  if (diffDays === 1) return `Ontem • ${time}`;
  return formatDateTimeBulletBR(date);
}

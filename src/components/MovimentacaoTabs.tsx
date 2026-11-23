"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Entrada", href: "/movimentacoes/entrada" },
  { label: "Saída", href: "/movimentacoes/saida" },
  { label: "Baixa por perda/avaria", href: "/movimentacoes/baixa" },
];

export function MovimentacaoTabs() {
  const pathname = usePathname();

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "rounded-md bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-md px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

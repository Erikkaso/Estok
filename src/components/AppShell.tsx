"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

interface AppShellProps {
  user: {
    id: string;
    nome: string;
    email: string;
    perfil: "ADMIN" | "OPERADOR";
  };
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  matchPrefix: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", matchPrefix: "/dashboard" },
  { label: "Produtos", href: "/produtos", matchPrefix: "/produtos" },
  {
    label: "Movimentações",
    href: "/movimentacoes/entrada",
    matchPrefix: "/movimentacoes",
  },
  { label: "Histórico", href: "/historico", matchPrefix: "/historico" },
  {
    label: "Usuários",
    href: "/usuarios",
    matchPrefix: "/usuarios",
    adminOnly: true,
  },
  { label: "Relatórios", href: "/relatorios", matchPrefix: "/relatorios" },
];

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user.perfil === "ADMIN"
  );

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1220] px-4 py-6 text-slate-300">
      <div>
        <div className="flex items-center justify-between px-3">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-wide text-white"
          >
            ESTOK
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-16 flex flex-col gap-1.5" aria-label="Navegação principal">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.matchPrefix ||
              pathname.startsWith(`${item.matchPrefix}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={
                  isActive
                    ? "rounded-lg bg-[#1D4ED8] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
                    : "rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.perfil === "ADMIN" ? "Administrador" : "Operador de Estoque"}
            </p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Encerrar sessão"
            aria-label="Sair"
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw]">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="flex items-center justify-between border-b border-slate-200 bg-[#0B1220] px-4 py-3 text-white lg:hidden">
          <Link href="/dashboard" className="text-base font-bold tracking-wide">
            ESTOK
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-200 hover:bg-white/10"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

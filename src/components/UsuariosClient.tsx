"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatRelativeAccessBR } from "@/lib/format";

export interface UsuarioRow {
  id: string;
  nome: string;
  email: string;
  perfil: "ADMIN" | "OPERADOR";
  ativo: boolean;
  ultimoAcesso: string | null;
}

interface UsuariosClientProps {
  initialUsuarios: UsuarioRow[];
  currentUserId: string;
}

export function UsuariosClient({
  initialUsuarios,
  currentUserId,
}: UsuariosClientProps) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState(initialUsuarios);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"ADMIN" | "OPERADOR">("OPERADOR");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, perfil }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Erro ao criar usuário.");
        return;
      }

      setUsuarios((prev) => [
        {
          ...data.usuario,
          ultimoAcesso: data.usuario.ultimoAcesso ?? null,
        },
        ...prev,
      ]);
      setNome("");
      setEmail("");
      setSenha("");
      setPerfil("OPERADOR");
      setModalAberto(false);
      router.refresh();
    } catch {
      setErro("Erro de conexão ao cadastrar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleStatus(usuario: UsuarioRow) {
    setProcessandoId(usuario.id);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !usuario.ativo }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? "Não foi possível alterar o status.");
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, ativo: data.usuario.ativo } : u
        )
      );
      router.refresh();
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Controle quem pode acessar o Estok e quais permissões cada pessoa
            possui.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErro(null);
            setModalAberto(true);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
        >
          + Novo usuário
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-sky-100/80 px-5 py-4 text-xs text-sky-950">
        <p className="font-bold">Permissões por perfil</p>
        <p className="mt-0.5 text-sky-900">
          Operadores acessam rotinas de estoque; Administradores/Gerentes também
          acessam usuários, preços e informações financeiras.
        </p>
      </div>

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Nome</th>
                <th className="px-5 py-3.5">E-mail</th>
                <th className="px-5 py-3.5">Perfil</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Último acesso</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {u.nome}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{u.email}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {u.perfil === "ADMIN"
                      ? "Administrador/Gerente"
                      : "Operador de Estoque"}
                  </td>
                  <td
                    className={
                      u.ativo
                        ? "px-5 py-4 font-semibold text-emerald-600"
                        : "px-5 py-4 font-semibold text-red-600"
                    }
                  >
                    {u.ativo ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatRelativeAccessBR(u.ultimoAcesso)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        disabled={processandoId === u.id}
                        onClick={() => handleToggleStatus(u)}
                        className="text-xs font-medium text-[#1D4ED8] hover:underline disabled:opacity-50"
                      >
                        {u.ativo ? "Inativar" : "Reativar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create user modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Novo usuário</h2>
            <p className="mt-1 text-xs text-slate-500">
              Cadastre um membro para acessar o sistema Estok.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {erro}
                </div>
              )}

              <div>
                <label
                  htmlFor="u-nome"
                  className="block text-xs font-medium text-slate-700"
                >
                  Nome completo *
                </label>
                <input
                  id="u-nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="u-email"
                  className="block text-xs font-medium text-slate-700"
                >
                  E-mail *
                </label>
                <input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="u-senha"
                  className="block text-xs font-medium text-slate-700"
                >
                  Senha inicial *
                </label>
                <input
                  id="u-senha"
                  type="password"
                  minLength={6}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="u-perfil"
                  className="block text-xs font-medium text-slate-700"
                >
                  Perfil de acesso *
                </label>
                <select
                  id="u-perfil"
                  value={perfil}
                  onChange={(e) =>
                    setPerfil(e.target.value as "ADMIN" | "OPERADOR")
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
                >
                  <option value="OPERADOR">Operador de Estoque</option>
                  <option value="ADMIN">Administrador/Gerente</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

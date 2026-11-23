"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível entrar.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro de conexão ao tentar entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthSplitLayout
      headline="Fazer login na plataforma!"
      description="Faça login a partir de uma tela simples e intuitiva."
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Bem-vindo ao Estok
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Entre com seu e-mail e senha para continuar.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {erro}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-slate-700"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seuemail@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label
            htmlFor="senha"
            className="block text-xs font-medium text-slate-700"
          >
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <Link
            href="/recuperar-senha"
            className="inline-block text-xs font-medium text-[#1D4ED8] hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

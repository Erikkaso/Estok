"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSucesso(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setErro("Erro de conexão ao redefinir a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Definir nova senha
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Escolha uma nova senha para acessar sua conta.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
            {sucesso}
          </div>
        )}

        <div>
          <label
            htmlFor="novaSenha"
            className="block text-xs font-medium text-slate-700"
          >
            Nova senha
          </label>
          <input
            id="novaSenha"
            type="password"
            required
            placeholder="••••••••"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label
            htmlFor="confirmarSenha"
            className="block text-xs font-medium text-slate-700"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmarSenha"
            type="password"
            required
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <button
          type="submit"
          disabled={carregando || !token}
          className="w-full rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
        >
          {carregando ? "Salvando..." : "Salvar nova senha"}
        </button>

        <div className="pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] hover:underline"
          >
            ← Voltar para o login
          </Link>
        </div>
      </form>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <AuthSplitLayout
      headline="Recupere o acesso com segurança."
      description="Defina uma nova senha forte para retomar o acesso ao Estok."
      footerNote="Segurança e rastreabilidade em primeiro lugar."
    >
      <Suspense
        fallback={<p className="text-sm text-slate-500">Carregando...</p>}
      >
        <RedefinirSenhaForm />
      </Suspense>
    </AuthSplitLayout>
  );
}

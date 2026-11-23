"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setDevResetUrl(null);
    setCarregando(true);

    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível enviar as instruções.");
        return;
      }

      setMensagem(data.message);
      if (typeof data.devResetUrl === "string") {
        setDevResetUrl(data.devResetUrl);
      }
    } catch {
      setErro("Erro de conexão ao solicitar recuperação.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthSplitLayout
      headline="Recupere o acesso com segurança."
      description="Informe seu e-mail cadastrado. Se houver uma conta associada, você receberá as instruções para redefinir sua senha."
      footerNote="Segurança e rastreabilidade em primeiro lugar."
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        Recuperar senha
      </h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Digite seu e-mail para receber as instruções de recuperação.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
            <p className="font-medium">{mensagem}</p>
            {devResetUrl && (
              <Link
                href={devResetUrl}
                className="mt-2 inline-block font-semibold text-[#1D4ED8] underline"
              >
                Abrir link de redefinição (ambiente dev)
              </Link>
            )}
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
            placeholder="seuemail@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] disabled:opacity-60"
        >
          {carregando ? "Enviando..." : "Enviar instruções"}
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
    </AuthSplitLayout>
  );
}

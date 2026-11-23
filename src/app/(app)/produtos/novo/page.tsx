import { Suspense } from "react";
import { connection } from "next/server";
import { PerfilUsuario } from "@prisma/client";
import { ProdutoForm } from "@/components/ProdutoForm";
import { requirePageAuth } from "@/lib/auth";

async function NovoProdutoContent() {
  await connection();
  const user = await requirePageAuth();
  return (
    <ProdutoForm mode="create" isAdmin={user.perfil === PerfilUsuario.ADMIN} />
  );
}

export default function NovoProdutoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl text-sm text-slate-500">
          Carregando formulário...
        </div>
      }
    >
      <NovoProdutoContent />
    </Suspense>
  );
}

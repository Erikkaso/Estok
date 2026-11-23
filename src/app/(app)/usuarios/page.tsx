import { Suspense } from "react";
import { connection } from "next/server";
import { UsuariosClient, type UsuarioRow } from "@/components/UsuariosClient";
import { requireAdminPageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function UsuariosLoader() {
  await connection();
  const currentUser = await requireAdminPageAuth();

  const rows = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      perfil: true,
      ativo: true,
      ultimoAcesso: true,
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  const usuarios: UsuarioRow[] = rows.map((u) => ({
    ...u,
    ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
  }));

  return (
    <UsuariosClient
      initialUsuarios={usuarios}
      currentUserId={currentUser.id}
    />
  );
}

export default function UsuariosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl text-sm text-slate-500">
          Carregando usuários...
        </div>
      }
    >
      <UsuariosLoader />
    </Suspense>
  );
}

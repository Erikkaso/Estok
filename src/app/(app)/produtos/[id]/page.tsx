import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { PerfilUsuario } from "@prisma/client";
import { ProdutoForm } from "@/components/ProdutoForm";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function EditarProdutoContent({ id }: { id: string }) {
  await connection();
  const user = await requirePageAuth();
  const isAdmin = user.perfil === PerfilUsuario.ADMIN;

  const produto = await prisma.produto.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      descricao: true,
      categoria: true,
      sku: true,
      codigoBarras: true,
      estoqueMinimo: true,
      precoCusto: isAdmin,
      precoVenda: true,
      status: true,
      quantidadeEstoque: true,
    },
  });

  if (!produto) {
    notFound();
  }

  return (
    <ProdutoForm
      mode="edit"
      isAdmin={isAdmin}
      initialData={{
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        categoria: produto.categoria,
        sku: produto.sku,
        codigoBarras: produto.codigoBarras,
        estoqueMinimo: produto.estoqueMinimo,
        precoCusto:
          isAdmin && "precoCusto" in produto
            ? Number(produto.precoCusto)
            : undefined,
        precoVenda: Number(produto.precoVenda),
        status: produto.status,
        quantidadeEstoque: produto.quantidadeEstoque,
      }}
    />
  );
}

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl text-sm text-slate-500">
          Carregando produto...
        </div>
      }
    >
      <EditarProdutoContent id={id} />
    </Suspense>
  );
}

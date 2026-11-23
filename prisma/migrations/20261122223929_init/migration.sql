-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusProduto" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'BAIXA');

-- CreateEnum
CREATE TYPE "MotivoBaixa" AS ENUM ('PERDA', 'AVARIA', 'EXTRAVIO', 'VENCIMENTO', 'OUTRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "token_versao" INTEGER NOT NULL DEFAULT 0,
    "reset_token_hash" TEXT,
    "reset_token_expira_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "codigo_barras" TEXT,
    "quantidade_estoque" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,
    "preco_custo" DECIMAL(10,2) NOT NULL,
    "preco_venda" DECIMAL(10,2) NOT NULL,
    "status" "StatusProduto" NOT NULL DEFAULT 'ATIVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo_anterior" INTEGER NOT NULL,
    "saldo_posterior" INTEGER NOT NULL,
    "motivo_baixa" "MotivoBaixa",
    "observacao" TEXT,
    "produto_id" TEXT NOT NULL,
    "responsavel_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_barras_key" ON "produtos"("codigo_barras");

-- CreateIndex
CREATE INDEX "produtos_nome_idx" ON "produtos"("nome");

-- CreateIndex
CREATE INDEX "produtos_categoria_idx" ON "produtos"("categoria");

-- CreateIndex
CREATE INDEX "produtos_status_idx" ON "produtos"("status");

-- CreateIndex
CREATE INDEX "movimentacoes_criado_em_idx" ON "movimentacoes"("criado_em");

-- CreateIndex
CREATE INDEX "movimentacoes_produto_id_idx" ON "movimentacoes"("produto_id");

-- CreateIndex
CREATE INDEX "movimentacoes_tipo_idx" ON "movimentacoes"("tipo");

-- CreateIndex
CREATE INDEX "movimentacoes_responsavel_id_idx" ON "movimentacoes"("responsavel_id");

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes" ADD CONSTRAINT "movimentacoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

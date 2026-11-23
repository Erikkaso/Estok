# Estok

Sistema de gerenciamento de estoque construído com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **PostgreSQL (Neon)** e autenticação **JWT**.

---

## Pré-requisitos

- **Node.js** `>= 20` (ou `v21.7.2` como no ambiente atual; para `neon skills`, recomenda-se `>= 22.20`)
- **npm** `>= 10`
- Banco **PostgreSQL** (local ou **Neon**)

---

## Passo a passo de instalação

### 1. Clonar o repositório e instalar dependências

```bash
git clone <url-do-repositorio>
cd Estok
npm install
```

### 2. Configurar variáveis de ambiente (`.env`)

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha as variáveis no `.env`:

```env
# Conexão principal (pooled, usada pela aplicação em runtime)
DATABASE_URL="postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Conexão direta (sem -pooler, usada pelo Prisma para migrations)
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-example.region.aws.neon.tech/neondb?sslmode=require"

# Segredo usado para assinar os tokens JWT (HS256)
JWT_SECRET="alterar-para-uma-chave-secreta-segura"
```

> **Dica (Neon):** se o projeto já estiver vinculado via `.neon`, você pode puxar `DATABASE_URL` e `DATABASE_URL_UNPOOLED` automaticamente com `neon env pull` (ou `neon.cmd env pull` no PowerShell).

### 3. Gerar o Prisma Client, aplicar migrations e rodar o seed

```bash
npm run db:generate
npx prisma migrate deploy
npm run db:seed
```

- Para criar uma nova migration após alterar `prisma/schema.prisma`, use: `npm run db:migrate`.
- Para abrir o visualizador de tabelas no navegador: `npm run db:studio`.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:3000** (redireciona automaticamente para `/login` ou `/dashboard`).

---

## Usuários de teste (Seed)

O script `prisma/seed.ts` cria dois usuários padrão (e 6 produtos + 5 movimentações iniciais se a tabela de movimentações estiver vazia):

| Perfil | E-mail | Senha | Acesso |
| --- | --- | --- | --- |
| `ADMIN` | `admin@estok.local` | `Admin@123` | Acesso completo (inclui Usuários, preço de custo e valor em estoque) |
| `OPERADOR` | `operador@estok.local` | `Operador@123` | Rotinas de estoque (sem gestão de usuários nem dados financeiros restritos) |

---

## Scripts úteis

| Comando | Função |
| --- | --- |
| `npm run dev` | Sobe o servidor Next.js em modo desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | Executa o ESLint |
| `npx tsc --noEmit` | Verifica tipagem TypeScript |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Cria/aplica migration em desenvolvimento (`prisma migrate dev`) |
| `npm run db:seed` | Popula dados iniciais com `tsx prisma/seed.ts` |

# Estok

Sistema de gerenciamento de estoque construído com **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **SQLite** e autenticação **JWT**.

---

## Pré-requisitos

- **Node.js** `>= 20` (ou `v21.7.2` como no ambiente atual)
- **npm** `>= 10`
- Banco **SQLite** (arquivo `prisma/estok.db`, já versionado e populado)

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

Preencha (opcional em dev) no `.env`:

```env
# Segredo usado para assinar os tokens JWT (HS256)
JWT_SECRET="alterar-para-uma-chave-secreta-segura"
```

> A conexão com o banco é fixa em `prisma/schema.prisma` (`file:./estok.db`); não é necessário configurar `DATABASE_URL`.

### 3. Gerar o Prisma Client, aplicar migrations e rodar o seed

```bash
npm run db:generate
# o banco prisma/estok.db já vem populado no repositório;
# para recriar do zero: npx prisma migrate reset
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

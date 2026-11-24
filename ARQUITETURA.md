# Arquitetura — Estok

Guia rápido para entender a organização do projeto, banco de dados, autenticação/RBAC e onde editar cada tela sem quebrar as regras de negócio.

---

## 1. Estrutura de pastas

```text
prisma/
  schema.prisma        # Modelos, enums e conexão SQLite (file:./estok.db)
  seed.ts              # Dados iniciais (ADMIN, OPERADOR, produtos e movimentações)
  migrations/          # Histórico SQL das migrations aplicadas

src/
  proxy.ts             # Middleware (Next.js 16 Proxy): redireciona /login <-> /dashboard pelo cookie JWT
  lib/
    prisma.ts          # Singleton do PrismaClient (usa a conexão SQLite fixa do schema)
    jwt.ts             # Assinatura e verificação do JWT com `jose` (compatível com Edge/Proxy)
    auth.ts            # Leitura de sessão via banco (`tokenVersao` + `ativo`) e guards RBAC
    format.ts          # Formatação pt-BR (R$, inteiros, datas e último acesso)
  components/
    AppShell.tsx       # Sidebar escura fixa + drawer mobile + botão Sair
    AuthSplitLayout.tsx# Layout dividido das telas públicas de autenticação
    ProdutosClient.tsx # Busca, filtro por status e tabela de produtos
    ProdutoForm.tsx    # Formulário compartilhado de cadastro e edição de produto
    MovimentacaoTabs.tsx # Abas Entrada | Saída | Baixa por perda/avaria
    MovimentacaoForm.tsx # Formulário transacional de Entrada, Saída e Baixa
    HistoricoClient.tsx  # Filtros e tabela do histórico de movimentações
    UsuariosClient.tsx   # Tabela de usuários, modal + Novo usuário e ativação/inativação
    RelatoriosClient.tsx # Relatório consolidado e exportação CSV
  app/
    page.tsx           # Redireciona `/` para `/dashboard` ou `/login`
    login/page.tsx
    recuperar-senha/page.tsx
    redefinir-senha/page.tsx
    (app)/             # Grupo de rotas protegidas (layout valida sessão no servidor)
      layout.tsx
      dashboard/page.tsx
      produtos/page.tsx
      produtos/novo/page.tsx
      produtos/[id]/page.tsx
      movimentacoes/page.tsx
      movimentacoes/entrada/page.tsx
      movimentacoes/saida/page.tsx
      movimentacoes/baixa/page.tsx
      historico/page.tsx
      usuarios/page.tsx
      relatorios/page.tsx
    api/
      health/route.ts
      auth/{login,logout,recuperar-senha,redefinir-senha}/route.ts
      produtos/route.ts & produtos/[id]/route.ts
      movimentacoes/route.ts
      usuarios/route.ts & usuarios/[id]/route.ts
```

---

## 2. Banco de dados (`prisma/schema.prisma`)

- **Conexão SQLite:** `url = "file:./estok.db"` fixa no `schema.prisma` (arquivo `prisma/estok.db` versionado).
- **Enums:**
  - `PerfilUsuario`: `ADMIN`, `OPERADOR`
  - `StatusProduto`: `ATIVO`, `INATIVO`
  - `TipoMovimentacao`: `ENTRADA`, `SAIDA`, `BAIXA`
  - `MotivoBaixa`: `PERDA`, `AVARIA`, `EXTRAVIO`, `VENCIMENTO`, `OUTRO`
- **Tabelas:**
  - `usuarios` (`Usuario`): `nome`, `email` (único), `senhaHash`, `perfil`, `ativo`, `tokenVersao`, `resetTokenHash`, `resetTokenExpiraEm`, `ultimoAcesso`.
  - `produtos` (`Produto`): `nome`, `descricao`, `categoria`, `sku` (único), `codigoBarras` (único opcional), `quantidadeEstoque`, `estoqueMinimo`, `precoCusto`, `precoVenda`, `status`.
  - `movimentacoes` (`Movimentacao`): `tipo`, `quantidade`, `saldoAnterior`, `saldoPosterior`, `motivoBaixa`, `observacao`, `produtoId`, `responsavelId`, `criadoEm`. Ambas as relações usam `onDelete: Restrict` para nunca perder histórico.

---

## 3. Autenticação JWT e Controle de Acesso (RBAC)

1. **Login (`POST /api/auth/login`):** valida e-mail, senha (`bcryptjs`) e `ativo === true`; atualiza `ultimoAcesso`; assina um JWT HS256 (`sub`, `perfil`, `tokenVersao`) em `src/lib/jwt.ts` e grava no cookie `HttpOnly` `estok_token` (expira em 8h; `secure` segue HTTPS ou `x-forwarded-proto`).
2. **Redirecionamento rápido (`src/proxy.ts`):** verifica apenas a assinatura do cookie para redirecionar rotas públicas (`/login`, `/recuperar-senha`, `/redefinir-senha`) e privadas sem abrir conexão com o banco.
3. **Validação real no servidor (`src/lib/auth.ts`):**
   - `getCurrentUser()` decodifica o cookie e busca o usuário no SQLite, conferindo `usuario.ativo === true` e `usuario.tokenVersao === payload.tokenVersao`.
   - `POST /api/auth/logout` e a inativação de usuário (`PATCH /api/usuarios/[id]`) incrementam `tokenVersao`, **invalidando imediatamente** qualquer JWT emitido antes.
4. **Regras por perfil:**
   - **Páginas:** `requirePageAuth()` protege todas as páginas em `src/app/(app)/`; `requireAdminPageAuth()` restringe `/usuarios` a `ADMIN`. O item `Usuários` também é ocultado na sidebar (`AppShell.tsx`) para `OPERADOR`.
   - **APIs e dados financeiros:** `requireApiAuth()` e `requireAdminApiAuth()` protegem os endpoints. Para `OPERADOR`, `/api/usuarios*` retorna `403`, o Dashboard exibe `"Restrito"` em `Valor em estoque`, e `/api/produtos*`, `ProdutoForm.tsx` e `/relatorios` omitem `precoCusto`.

---

## 4. Onde mexer em cada tela (sem quebrar o estoque)

| Tela | Arquivo(s) de UI | API / Dados | Cuidado crítico para não quebrar |
| --- | --- | --- | --- |
| **1. Login** | `src/app/login/page.tsx`, `AuthSplitLayout.tsx` | `POST /api/auth/login` | Manter envio de `{ email, senha }` e `credentials` via cookie `HttpOnly`. |
| **2. Recuperação de senha** | `src/app/recuperar-senha/page.tsx`, `redefinir-senha/page.tsx` | `POST /api/auth/recuperar-senha` e `redefinir-senha` | Manter hash SHA-256 do token e incremento de `tokenVersao` ao redefinir. |
| **3. Dashboard** | `src/app/(app)/dashboard/page.tsx` | Prisma direto (Server Component) | Manter `<Suspense>` + `await connection()` (exigência do `cacheComponents` no Next 16) e ocultar `precoCusto` para `OPERADOR`. |
| **4. Produtos** | `src/app/(app)/produtos/page.tsx`, `ProdutosClient.tsx` | `GET /api/produtos` | Manter o status visual derivado (`Sem estoque`, `Baixo`, `Normal`, `Inativo`) coerente com `quantidadeEstoque <= estoqueMinimo`. |
| **5. Produto (cadastro/edição)** | `produtos/novo/page.tsx`, `produtos/[id]/page.tsx`, `ProdutoForm.tsx` | `POST /api/produtos`, `PATCH /api/produtos/[id]` | **Nunca** enviar ou atualizar `quantidadeEstoque` na edição de produto/preço; apenas a tela de Movimentações altera saldo físico. |
| **6. Entrada de estoque** | `movimentacoes/entrada/page.tsx`, `MovimentacaoForm.tsx` | `POST /api/movimentacoes` | Toda alteração visual deve continuar delegando o cálculo final e a gravação para `prisma.$transaction` na API. |
| **7. Saída de estoque** | `movimentacoes/saida/page.tsx`, `MovimentacaoForm.tsx` | `POST /api/movimentacoes` | Manter a validação de `quantidade > 0` e `quantidade <= saldo` também no backend (a prévia no front não substitui a trava transacional). |
| **8. Baixa por perda/avaria** | `movimentacoes/baixa/page.tsx`, `MovimentacaoForm.tsx` | `POST /api/movimentacoes` | Sempre enviar `tipo: "BAIXA"` com `motivoBaixa` do enum `MotivoBaixa`; produtos `INATIVO` devem continuar bloqueados na API. |
| **9. Histórico** | `src/app/(app)/historico/page.tsx`, `HistoricoClient.tsx` | `GET /api/movimentacoes` | Manter leitura de `saldoAnterior`, `saldoPosterior`, `motivoBaixa` e `responsavel` sem alterar registros já gravados. |
| **10. Usuários** | `src/app/(app)/usuarios/page.tsx`, `UsuariosClient.tsx` | `GET/POST /api/usuarios`, `PATCH /api/usuarios/[id]` | Manter `requireAdminPageAuth()` e `requireAdminApiAuth()`, e preservar a trava que impede o admin logado de se auto-inativar. |

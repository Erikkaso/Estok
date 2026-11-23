# Especificação do Sistema — Estok

## Design (Figma)

- [Estok — Sistema de Gerenciamento de Estoque (Figma)](https://www.figma.com/design/uzdNtcp1VBKm0PIMm3SEyA/Estok-—-Sistema-de-Gerenciamento-de-Estoque?node-id=2-40)

---

## Stack Obrigatória

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **ORM / Banco de Dados:** Prisma ORM + PostgreSQL
- **Autenticação:** JWT

---

## Perfis de Acesso

- **ADMIN:** Administrador/Gerente.
- **OPERADOR:** Operador de Estoque (não acessa gestão de usuários nem dados financeiros restritos).

---

## Requisitos Funcionais

### 1. Usuários e Autenticação (`EST-AUT-001` a `006`)

- Login por e-mail e senha com JWT.
- Recuperação de senha por e-mail válido.
- Encerramento de sessão invalidando o acesso a rotas protegidas.
- Controle de acesso por perfil.
- Listagem, cadastro e inativação de usuários.

### 2. Produtos e Código de Barras (`EST-MOV-001` a `004`, `EST-MOV-010`)

- Cadastro, edição e inativação de produto com os seguintes dados:
  - Nome / descrição
  - Categoria
  - Código de barras / SKU
  - Estoque mínimo
  - Preço de custo
  - Preço de venda
  - Status (`ativo` / `inativo`)
- **Regras de negócio:**
  - Inativar impede novas movimentações, mas mantém o produto no banco para preservar o histórico.
  - Alterar preço não altera a quantidade física em estoque.
- **Busca:** por nome, SKU/código de barras e status, incluindo localização ágil por código de barras.

### 3. Movimentações e Histórico (`EST-MOV-005` a `008`)

- **Entrada:**
  - Quantidade `> 0` (bloqueia valores nulos ou negativos).
  - Exibe saldo atual e prévia do novo saldo antes de confirmar.
  - Atualiza o saldo do produto.
- **Saída:**
  - Quantidade `> 0` e `<= saldo disponível`.
  - Exibe prévia antes de confirmar e impede saldo negativo.
- **Baixa por perda/avaria:**
  - Campos: produto, motivo (perda, avaria, extravio etc.), quantidade e observação opcional.
  - Reduz o saldo e registra no histórico.
- **Histórico:**
  - Registra data/hora, tipo, produto, quantidade e responsável.
  - Filtros por período, produto, tipo e responsável.

### 4. Dashboard, Alertas e Relatórios (`EST-REL-001` a `003`, `EST-MOV-009`)

- Indicadores de:
  - Produtos ativos
  - Itens em estoque
  - Valor financeiro estimado (respeitando o perfil de acesso)
  - Saídas do período
  - Movimentações recentes
- Destaque/alerta para itens que precisam de reposição (`EST-MOV-009`).
- Relatórios com filtros e exportação CSV/PDF (caso entrem no escopo).

---

## Requisitos Não Funcionais (`EST-RNF-001` a `007`)

- Validação de dados.
- Integridade nas operações de estoque.
- Segurança de senha e sessão.
- Boa usabilidade e responsividade.
- Código organizado.

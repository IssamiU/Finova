# Finova — Controle financeiro pessoal

Aplicação web moderna de controle de gastos e finanças pessoais. Frontend em React + TypeScript com TanStack Start, backend em Supabase (Postgres + Auth + RLS).

## Funcionalidades

- Autenticação por e-mail/senha (Supabase Auth)
- Cadastro de salário base, receitas, despesas fixas, variáveis e parceladas
- Categorias personalizáveis com cores
- Dashboard com KPIs, gráficos e insights automáticos
- Orçamento mensal por categoria com alertas quando o limite é ultrapassado
- Metas financeiras com progresso visual
- Relatórios com evolução de 12 meses
- Filtros por mês, categoria, tipo e busca textual
- RLS no Supabase: cada usuário só vê os próprios dados

## Stack

- React 19 + TypeScript
- TanStack Start (Vite)
- Tailwind CSS v4
- shadcn/ui + Radix
- Supabase (`@supabase/supabase-js`)
- Recharts

## Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...   # anon/publishable key
```

> Apenas a **chave publishable/anon** é usada no frontend. A service_role nunca deve ser exposta.

## Schema do banco (Supabase)

Tabelas criadas:

- `profiles` — perfil do usuário (display_name, base_salary, currency)
- `categories` — categorias do usuário (name, type, color, icon)
- `transactions` — lançamentos (description, amount, type, date, is_fixed, installments)
- `budgets` — limite mensal por categoria (category_id, month, amount)
- `financial_goals` — metas (name, target_amount, current_amount, deadline)

Cada tabela tem RLS habilitada com policy `auth.uid() = user_id`. Ao criar conta, um trigger gera o profile e categorias padrão automaticamente.

O SQL completo está em `supabase/migrations/` e pode ser aplicado em qualquer projeto Supabase pelo SQL Editor.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

## Deploy na Vercel

1. Suba o projeto no GitHub.
2. Importe na Vercel.
3. Em **Settings → Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Build padrão (`npm run build`) e output detectado automaticamente pela Vercel.

> Este projeto usa TanStack Start. Para Vercel, pode ser necessário configurar o adapter Node/Vercel. A lógica é 100% client-side (Supabase no browser via RLS), então também é trivial portar para um Vite SPA puro se preferir.

## Migrar de Lovable Cloud para seu próprio Supabase

1. Crie um projeto novo em https://supabase.com.
2. Execute as migrations SQL no SQL Editor.
3. Pegue `Project URL` e `anon public key` em **Settings → API**.
4. Atualize `.env` (ou variáveis na Vercel).
5. Pronto — o cliente Supabase é o oficial `@supabase/supabase-js`, sem nenhum acoplamento ao Lovable.

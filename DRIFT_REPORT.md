# Drift Report — Auditoria do Schema (Supabase)

- **Projeto**: `tvzqzzpfygiizcdcwfkc` (Controle Financeiro)
- **Data da auditoria**: 19/08/2026
- **Método**: Supabase Management API (SQL read-only em `pg_catalog`) + sondagens REST (anon key)
- **Evidências brutas**: `audit/01_columns.json` ... `audit/11_uuid_functions.json` (não versionados no git — contêm dados pessoais)

---

## 1. Resumo Executivo

| Verificação | Resultado |
|---|---|
| Tabelas (`profiles`, `categories`, `transactions`, `energy_logs`, `goals`) | Existem e com RLS habilitado |
| Coluna `monthly_goal` (patch `alter_profiles_goal.sql`) | Aplicada (default `2000`) |
| Políticas de categorias globais (patch `patch_categories_rls.sql`) | Aplicadas |
| Role admin `jcc.cacir@gmail.com` (patch `fix_admin_profile.sql`) | Aplicada |
| Trigger `handle_new_user` + função | Presentes e habilitados |
| Constraints (PK, FK, CHECK, UNIQUE) | Todas presentes |
| **Drift estrutural entre `schema.sql` + patches × produção** | **Zero** |

Os 3 patches locais já estão aplicados na produção. Porém a auditoria encontrou **2 vulnerabilidades herdadas do `schema.sql` original**, corrigidas na migration `0002_fixes.sql`.

---

## 2. Achados por Risco

### 🔴 ALTA — Escalonamento de privilégio via `profiles.role`
- **Onde**: política `"Users can update own profile"` (UPDATE) em `profiles`
- **Problema**: a política tem `USING (auth.uid() = id)` mas **sem `WITH CHECK`**. No PostgreSQL, quando `WITH CHECK` é omitido ele assume a expressão `USING` — logo qualquer usuário autenticado pode alterar **qualquer coluna da própria linha**, incluindo `role`, promovendo-se a `admin` via REST API. Isso concede acesso a categorias globais (insert/delete de admin).
- **Correção**: `WITH CHECK` explícito (impede mudança de `role`) + grants colunares (UPDATE limitado a `id`, `email`, `monthly_goal`).

### 🔴 ALTA — Ausência de política INSERT em `profiles`
- **Onde**: tabela `profiles`
- **Problema**: o frontend usa `upsert` para salvar a meta mensal (`settings.js`). Sem política INSERT, qualquer inserção via cliente falha se a linha do profile não existir (ex.: usuário criado por fluxo fora do trigger). O `upsert` só funciona hoje porque a linha já existe.
- **Correção**: política INSERT `WITH CHECK (auth.uid() = id AND role = 'user')` — o usuário só pode criar o próprio perfil, sempre com role `user`.

### 🟡 MÉDIA — Leitura anônima de categorias globais
- **Onde**: política SELECT de `categories` (`user_id IS NULL OR auth.uid() = user_id`)
- **Problema**: qualquer pessoa com a anon key (pública) consegue listar as categorias globais sem autenticação. São dados de baixa sensibilidade (nomes), mas é exposição não necessária.
- **Ação**: documentado como design; opcionalmente migrar para RPC autenticada no futuro.

### 🟢 BAIXA — `uuid_generate_v4()` como default
- **Onde**: `id` de `categories`, `transactions`, `energy_logs`, `goals`
- **Problema**: função do pacote `uuid-ossp`; funciona (extensões `uuid-ossp` e `pgcrypto` presentes), mas o padrão moderno do Supabase é `gen_random_uuid()` (pg_catalog, sem extensão).
- **Ação**: mantido por paridade; recomendação de migração futura, sem urgência.

---

## 3. Estado dos Dados (snapshot)

| Tabela | Linhas |
|---|---|
| `profiles` | 2 (1 admin, 1 user) |
| `categories` | 10 (todas globais) |
| `transactions` | 10 |
| `energy_logs` | 1 |
| `goals` | 0 |

---

## 4. Políticas RLS auditadas (9)

| Tabela | Política | Cmd | Observação |
|---|---|---|---|
| `categories` | view global and own | SELECT | Leitura anon de globais (design) |
| `categories` | insert own or global | INSERT | Admin gerencia globais ✅ |
| `categories` | update own | UPDATE | ✅ |
| `categories` | delete own or global | DELETE | Admin gerencia globais ✅ |
| `transactions` | CRUD own | ALL | `auth.uid() = user_id` ✅ |
| `energy_logs` | CRUD own | ALL | ✅ |
| `goals` | CRUD own | ALL | ✅ |
| `profiles` | view own | SELECT | ✅ |
| `profiles` | update own | UPDATE | **⚠️ sem WITH CHECK (fix 0002)** |

---

## 5. Plano de Correção

| # | Migration | Conteúdo |
|---|---|---|
| 1 | `20260819000100_baseline.sql` | Estado real de produção (paridade) |
| 2 | `20260819000200_fixes.sql` | Política INSERT em `profiles`; UPDATE com `WITH CHECK`; grants colunares |

Após aplicar: re-auditoria para confirmar as novas políticas e zero regressão.
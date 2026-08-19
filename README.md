# Cacir - Controle Financeiro

Aplicação web profissional de controle financeiro desenvolvida com **HTML, CSS e JavaScript Puro**, sem frameworks.

## Funcionalidades
- **Dashboard**: Visão geral de fluxo de caixa, despesas por categoria e metas.
- **Transações**: CRUD de Receitas e Despesas com filtros.
- **Energia**: Controle de economia entre faturas CPFL e Serena.
- **Configurações**: Gerenciamento de perfil, temas e categorias.
- **Auth**: Autenticação segura via Supabase.
- **Visual**: Glassmorphism, Dark/Light Mode.

## Configuração (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Vá para o **SQL Editor** e execute o script contido em `schema.sql`.
3. Vá para **Project Settings > API**.
4. Copie a `Project URL` e a `anon public key`.
5. Abra o arquivo `js/config.js` e cole suas credenciais:
   ```javascript
   export const SUPABASE_URL = 'SUA_URL';
   export const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON';
   ```

## Usuário Admin Padrão
O sistema diferencia Admin de usuários comuns pelo email.
- **Email**: jcc.cacir@gmail.com
- **Senha**: (Definida por você no cadastro ou login)

## Como Rodar

### Localmente
Você precisa de um servidor HTTP simples, pois o projeto usa ES Modules.
Se tiver o Node.js instalado:
```bash
npx serve .
```
Ou com Python:
```bash
python -m http.server 8000
```
Acesse `http://localhost:8000`.

### GitHub Pages
1. Faça o push deste código para um repositório GitHub.
2. Vá em **Settings > Pages**.
3. Selecione a branch `main` (ou master) e a pasta `/` (root).
4. Salve. O site estará no ar em instantes.

## Estrutura de Arquivos
- `index.html`: Shell da aplicação.
- `styles.css`: Design System e Estilos Globais.
- `js/app.js`: Inicialização.
- `js/router.js`: Roteamento SPA.
- `js/views/`: Componentes de Tela (Login, Dashboard, etc).
- `js/supabase.js`: Cliente de Banco de Dados.
- `supabase/migrations/`: Migrations versionadas (fonte da verdade do banco).
- `schema.sql`: Estado final do schema (documentação; preferir as migrations).
- `DRIFT_REPORT.md`: Auditoria do schema vs produção.

## Migrations (Supabase CLI)

Toda mudança de banco deve ser uma migration versionada em `supabase/migrations/`:

```bash
supabase login                 # access token (Account → Access Tokens)
supabase link --project-ref tvzqzzpfygiizcdcwfkc
supabase db push               # aplica migrations pendentes
supabase db diff --linked      # verifica drift (deve ser zero)
```

**Histórico aplicado** (19/08/2026):
- `20260819000100_baseline.sql` — estado real de produção (schema + 3 patches consolidados)
- `20260819000200_fixes.sql` — correções de segurança da auditoria

## Modelo de Segurança (RLS)

- **Anon key** (`js/config.js`) é pública por design — toda a proteção está no **RLS**; a `service_role` key nunca deve sair do dashboard Supabase.
- Cada usuário acessa somente os próprios dados (`auth.uid() = user_id`) em `transactions`, `energy_logs` e `goals`.
- `profiles`: SELECT/INSERT/UPDATE restritos à própria linha; `role` imutável via `WITH CHECK` + grants colunares (UPDATE apenas em `id`, `email`, `monthly_goal`).
- Categorias globais (`user_id IS NULL`): leitura por qualquer anon key; gerenciamento (insert/delete) exclusivo do admin (`jcc.cacir@gmail.com`).
- Mudanças futuras de RLS **somente via migrations**, nunca scripts soltos (os antigos `alter_profiles_goal.sql`, `fix_admin_profile.sql` e `patch_categories_rls.sql` já foram consolidados na baseline).

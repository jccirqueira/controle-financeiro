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

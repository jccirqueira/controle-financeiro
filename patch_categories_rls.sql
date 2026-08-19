-- Execute no SQL Editor do Supabase para corrigir as permissões de Categorias

-- 1. Remove as políticas antigas
drop policy "Users can insert own categories" on categories;
drop policy "Users can delete own categories" on categories;

-- 2. Cria novas políticas permitindo Admin gerenciar categorias globais (null user_id)
create policy "Users can insert own or global categories" on categories for insert with check (
  auth.uid() = user_id OR 
  (user_id is null AND exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
);

create policy "Users can delete own or global categories" on categories for delete using (
  auth.uid() = user_id OR 
  (user_id is null AND exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
);

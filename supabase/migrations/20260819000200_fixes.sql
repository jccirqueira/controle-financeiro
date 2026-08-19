-- ============================================================
-- 20260819000200_fixes.sql
-- Correções de segurança e robustez (auditoria 19/08/2026)
-- Referência: DRIFT_REPORT.md
--
-- 1. Fecha escalonamento de privilégio: UPDATE em profiles
--    sem WITH CHECK permitia ao usuário alterar a própria role
--    (ex.: promover-se a 'admin') via REST API.
-- 2. Adiciona política INSERT em profiles (robustez do upsert
--    da meta mensal no frontend; role sempre 'user').
-- 3. Grants colunares: UPDATE restrito a colunas não sensíveis.
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles: política UPDATE com WITH CHECK explícito
--    (a role da nova linha deve ser idêntica à já existente)
-- ------------------------------------------------------------
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role is not distinct from (
      select p.role from public.profiles p where p.id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 2. profiles: política INSERT (usuário cria apenas o próprio
--    perfil, sempre com role 'user')
-- ------------------------------------------------------------
create policy "Users can insert own profile" on public.profiles
  for insert
  with check (auth.uid() = id and role = 'user');

-- ------------------------------------------------------------
-- 3. profiles: grants colunares (defesa em profundidade)
--    - anon/authenticated perdem UPDATE amplo
--    - authenticated pode atualizar apenas id, email, monthly_goal
--    - service_role (superusuário) não é afetado
-- ------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;

grant update (id, email, monthly_goal) on public.profiles to authenticated;
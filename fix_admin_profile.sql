-- Verifique se o seu usuário admin existe na tabela de perfis sem a role correta
-- 1. Insira ou atualize o perfil do admin (Garante que o perfil existe e é admin)
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'jcc.cacir@gmail.com'
on conflict (id) do update
set role = 'admin';

-- 2. Verifique se as permissões foram aplicadas corretamente na tabela
select * from public.profiles where email = 'jcc.cacir@gmail.com';

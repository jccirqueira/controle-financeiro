-- ============================================================
-- 20260819000100_baseline.sql
-- Baseline — Estado real de produção em 19/08/2026
-- Gerado a partir de auditoria via Management API (pg_catalog)
-- Projeto: tvzqzzpfygiizcdcwfkc
-- Contém: schema.sql + 3 patches (alter_profiles_goal,
--         fix_admin_profile, patch_categories_rls) já aplicados.
-- ============================================================

-- Extensões presentes em produção (uuid-ossp e pgcrypto permitem uuid_generate_v4)
-- create extension if not exists "uuid-ossp";
-- create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user'::text check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  monthly_goal numeric default 2000
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger: cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users, -- Null means global category
  name text not null,
  type text check (type in ('income', 'expense')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.categories enable row level security;

create policy "Users can view global and own categories" on categories
  for select using (user_id is null or auth.uid() = user_id);

create policy "Users can insert own or global categories" on categories
  for insert with check (
    auth.uid() = user_id OR
    (user_id is null AND exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

create policy "Users can update own categories" on categories
  for update using (auth.uid() = user_id);

create policy "Users can delete own or global categories" on categories
  for delete using (
    auth.uid() = user_id OR
    (user_id is null AND exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

-- ------------------------------------------------------------
-- TRANSACTIONS (Receitas e Despesas)
-- ------------------------------------------------------------
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount numeric not null,
  date date not null,
  description text not null,
  category_id uuid references public.categories,
  category_name text, -- Fallback text
  type text check (type in ('income', 'expense')),
  payment_method text, -- Only for expenses
  observation text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

create policy "Users can CRUD own transactions" on transactions
  for all using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- ENERGY LOGS
-- ------------------------------------------------------------
create table public.energy_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  cpfl_amount numeric not null,
  serena_amount numeric not null,
  month int not null,
  year int not null,
  savings_amount numeric generated always as (cpfl_amount - serena_amount) stored,
  savings_percent numeric generated always as ((cpfl_amount - serena_amount) / cpfl_amount * 100) stored,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.energy_logs enable row level security;

create policy "Users can CRUD own energy logs" on energy_logs
  for all using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- GOALS (Metas)
-- ------------------------------------------------------------
create table public.goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  month int not null,
  year int not null,
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, month, year)
);

alter table public.goals enable row level security;

create policy "Users can CRUD own goals" on goals
  for all using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Dados: categorias globais default (estado de produção)
-- ------------------------------------------------------------
insert into public.categories (name, type) values
('Salário', 'income'), ('Investimentos', 'income'), ('Extra', 'income'), ('Aposentadoria', 'income'),
('Alimentação', 'expense'), ('Moradia', 'expense'), ('Transporte', 'expense'),
('Saúde', 'expense'), ('Lazer', 'expense'), ('Educação', 'expense')
on conflict do nothing;
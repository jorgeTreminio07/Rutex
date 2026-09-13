-- ============================================================
-- RUTEX - Esquema inicial (ejecutar en Supabase SQL Editor)
-- Base de datos PostgreSQL de Supabase
-- ============================================================

-- ---------- CATÁLOGO DE ESTADOS ----------
create table if not exists public.statuses (
  id          int primary key,
  name        text not null unique,
  description text
);

insert into public.statuses (id, name) values
  (1, 'Activo'),
  (2, 'Inactivo'),
  (3, 'Bloqueado'),
  (4, 'Eliminado')
on conflict (id) do nothing;

-- ---------- ROLES ----------
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  status_id   int not null default 1 references public.statuses(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  deleted_at  timestamptz
);

create unique index if not exists ux_roles_name on public.roles (name) where deleted_at is null;
create index if not exists ix_roles_status on public.roles (status_id);

-- ---------- PERFILES (vínculo con auth.users) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text,
  first_name    text,
  last_name     text,
  email         text,
  image_url     text,
  signature_url text,
  role_id       uuid references public.roles(id),
  status_id     int not null default 1 references public.statuses(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz,
  deleted_at    timestamptz
);

create index if not exists ix_profiles_role on public.profiles (role_id);
create index if not exists ix_profiles_status on public.profiles (status_id);

-- ---------- PERFIL DE LA TIENDA (single row) ----------
create table if not exists public.store_profile (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  owner_name    text,
  logo_url      text,
  stamp_url     text,
  signature_url text,
  ruc           text,
  email         text,
  address       text,
  phone         text,
  working_hours text,
  payment_plans_enabled boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

-- ---------- CUENTAS BANCARIAS ----------
create table if not exists public.bank_accounts (
  id               uuid primary key default gen_random_uuid(),
  store_profile_id uuid not null references public.store_profile(id) on delete cascade,
  bank_name        text not null,
  account_number   text not null,
  account_holder   text,
  currency         text not null default 'C$',
  qr_url           text,
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index if not exists ix_bank_accounts_store on public.bank_accounts (store_profile_id);

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

-- ¿Es el rol 'admin'? (por nombre normalizado, sin acentos)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and lower(regexp_replace(lower(r.name), '[^a-z]', '', 'g')) = 'admin'
      and p.status_id = 1
      and r.status_id = 1
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.store_profile enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.statuses enable row level security;

-- ROLES: cualquiera autenticado lee; solo administradores escriben
create policy "roles_select" on public.roles for select using (auth.uid() is not null);
create policy "roles_insert" on public.roles for insert with check (public.is_admin());
create policy "roles_update" on public.roles for update using (public.is_admin());
create policy "roles_delete" on public.roles for delete using (public.is_admin());

-- PROFILES: lectura para autenticados; cada usuario edita su perfil; admin todo
create policy "profiles_select" on public.profiles for select using (auth.uid() is not null);
create policy "profiles_insert" on public.profiles for insert with check (public.is_admin() or auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (public.is_admin() or auth.uid() = id);
create policy "profiles_delete" on public.profiles for delete using (public.is_admin());

-- STORE_PROFILE: lectura autenticada; escritura admin
create policy "store_select" on public.store_profile for select using (auth.uid() is not null);
create policy "store_insert" on public.store_profile for insert with check (public.is_admin());
create policy "store_update" on public.store_profile for update using (public.is_admin());
create policy "store_delete" on public.store_profile for delete using (public.is_admin());

-- BANK_ACCOUNTS: lectura autenticada; escritura admin
create policy "bank_select" on public.bank_accounts for select using (auth.uid() is not null);
create policy "bank_insert" on public.bank_accounts for insert with check (public.is_admin());
create policy "bank_update" on public.bank_accounts for update using (public.is_admin());
create policy "bank_delete" on public.bank_accounts for delete using (public.is_admin());

-- STATUSES: lectura autenticada
create policy "statuses_select" on public.statuses for select using (auth.uid() is not null);

-- ============================================================
-- DISPARADOR: mantener el email del auth.users sincronizado
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Rol administrador (actor para is_admin)
insert into public.roles (name, description, status_id) values
  ('Admin', 'Administrador del sistema', 1)
on conflict do nothing;

-- Perfil de la tienda (single row)
insert into public.store_profile (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Mi Tienda')
on conflict (id) do nothing;

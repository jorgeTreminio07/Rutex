-- =====================================================================
-- RUTEX - INSTALACIÓN DEFINITIVA PARA UN CLIENTE NUEVO
-- =====================================================================
-- Este archivo crea la base de datos COMPLETA del sistema desde cero.
-- Es la suma de schema.sql + los patches de migración 001..033 en orden
-- (se omiten 007/009 (rollbacks) y 020 (wipe de datos) porque no aplican
-- a una base nueva).
--
-- CÓMO USAR:
--   1) Crear un proyecto nuevo en Supabase.
--   2) Abrir el SQL Editor, pegar TODO este archivo y ejecutar (RUN).
--   3) En "Authentication > Users > Add user" crear el primer usuario
--      (email + contraseña). Ese usuario queda como ADMIN automáticamente
--      (ver bloque 4 al final de este archivo).
--   4) Configurar las env vars en Vercel:
--      NEXT_PUBLIC_SUPABASE_URL
--      NEXT_PUBLIC_SUPABASE_ANON_KEY
--      SUPABASE_SERVICE_ROLE_KEY
--      SUPABASE_STORAGE_BUCKET  (por defecto: rutex)
--      NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET
--      NEXT_PUBLIC_SUPABASE_STORAGE_URL
--      BANK_ACCOUNT_ENC_KEY  (64 hex = 32 bytes; generarla con:
--        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
--        La MISMA clave en .env.local y Vercel. Si cambia, los números
--        de cuenta ya cifrados no se pueden descifrar).
--
-- NOMBRE DEL BUCKET: el bloque 4 crea el bucket "rutex". Si vas a usar
-- otro nombre, puede ejecutar la sección 4 con otro nombre y ajustar las
-- env vars SUPABASE_STORAGE_BUCKET y NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET.
--
-- Diseñado para UNA sola ejecución sobre una base vacía. La mayoría de
-- bloques usan create if not exists / on conflict / drop + create, pero
-- no es un script 100% re-ejecutable (algunos alter table add column no
-- tienen guardas IF NOT EXISTS).
-- =====================================================================

-- ============================================================
-- BLOQUE: schema.sql
-- ============================================================

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


-- ============================================================
-- BLOQUE: patches\001-fix-is-admin.sql
-- ============================================================

-- ============================================================
-- RUTEX - CORRECCIÓN 1: is_admin()
-- El regexp [^a-z] eliminaba la letra mayúscula 'A' de "Admin"
-- dejando "dmin" != "admin". Se normaliza a minúsculas primero.
-- ============================================================

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
-- BLOQUE: patches\002-products-orders.sql
-- ============================================================

-- ============================================================
-- RUTEX - Productos y Pedidos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ---------- NUEVOS ESTADOS PARA PEDIDOS ----------
insert into public.statuses (id, name, description) values
  (5, 'En proceso', 'Pedido recibido, pendiente de revisión'),
  (6, 'Aprobado', 'Pedido aprobado y confirmado'),
  (7, 'Rechazado', 'Pedido rechazado')
on conflict (id) do nothing;

-- ---------- PRODUCTOS ----------
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  price           numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  category        text not null,
  stock           int not null default 0,
  images          jsonb not null default '[]'::jsonb,
  status_id       int not null default 1 references public.statuses(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz
);

create index if not exists ix_products_status on public.products (status_id);
create index if not exists ix_products_category on public.products (category);
create index if not exists ix_products_created on public.products (created_at);

-- ---------- PEDIDOS ----------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text,
  customer_name   text not null,
  customer_phone  text,
  items           jsonb not null default '[]'::jsonb,
  total           numeric(12,2) not null default 0,
  status_id       int not null default 5 references public.statuses(id),
  payment_type    text not null default 'contado',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz,
  deleted_at      timestamptz
);

create index if not exists ix_orders_status on public.orders (status_id);
create index if not exists ix_orders_created on public.orders (created_at);
create index if not exists ix_orders_customer on public.orders (customer_name);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- PRODUCTS: lectura para todos (catálogo público); escritura admin
create policy "products_select" on public.products for select using (true);
create policy "products_insert" on public.products for insert with check (public.is_admin());
create policy "products_update" on public.products for update using (public.is_admin());
create policy "products_delete" on public.products for delete using (public.is_admin());

-- ORDERS: lectura autenticada; creación pública (clientes); actualización admin
create policy "orders_select" on public.orders for select using (auth.uid() is not null);
create policy "orders_insert" on public.orders for insert with check (true);
create policy "orders_update" on public.orders for update using (public.is_admin());
create policy "orders_delete" on public.orders for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\003-products-purchase-price.sql
-- ============================================================

-- ============================================================
-- RUTEX - Precio de compra en productos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agrega el precio de compra (lo que le costo al dueño)
alter table public.products
  add column if not exists purchase_price numeric(12,2) not null default 0;

-- ============================================================
-- STORAGE: carpeta para fotos de productos
-- ============================================================
-- El bucket ya es público (rutex-storage). Los archivos se guardan
-- en productos/<nombre-slug>-<hash>.<ext> vía la API /api/uploads.
-- No se requiere SQL adicional: el servicio crea la carpeta
-- automáticamente al subir el primer archivo.


-- ============================================================
-- BLOQUE: patches\004-order-number-sequential.sql
-- ============================================================

-- ============================================================
-- RUTEX - Número de pedido secuencial e irrepetible
-- Ejecutar en Supabase SQL Editor
-- Formato: PED[YYYYMMDD][6 dígitos secuenciales]  =>  PED20260907000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.order_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCIÓN ATOMICA (devuelve el siguiente número) ----------
create or replace function public.next_order_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.order_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.order_counters.last_number + 1
  returning 'PED' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_order_number() to anon, authenticated, service_role;

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.order_counters (day, last_number)
select current_date, coalesce(max((regexp_match(order_number, '^PED[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.orders
where order_number ~ '^PED[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- GARANTÍA EXTRA: deduplicar históricos y forzar unicidad ----------
with ranked as (
  select id,
         row_number() over (partition by order_number order by created_at) as rn
  from public.orders
  where order_number is not null
)
update public.orders o
set order_number = o.order_number || '-' || o.id::text
from ranked r
where o.id = r.id and r.rn > 1;

create unique index if not exists ux_orders_order_number on public.orders (order_number);


-- ============================================================
-- BLOQUE: patches\005-order-statuses.sql
-- ============================================================

-- ============================================================
-- RUTEX - Tabla propia de estados de pedidos
-- Ejecutar en Supabase SQL Editor
-- Los pedidos dejan de usar public.statuses(5,6,7) y pasan a
-- public.order_statuses.
-- ============================================================

-- ---------- TABLA DE ESTADOS DE PEDIDO ----------
create table if not exists public.order_statuses (
  id          int primary key,
  name        text not null unique,
  description text
);

insert into public.order_statuses (id, name, description) values
  (4, 'Eliminado', 'Pedido eliminado'),
  (5, 'En proceso', 'Pedido recibido, pendiente de revisión'),
  (6, 'Aprobado', 'Pedido aprobado y confirmado'),
  (7, 'Rechazado', 'Pedido rechazado')
on conflict (id) do nothing;

-- ---------- RE-PARA LA CLAVE FORÁNEA DE PEDIDOS ----------
-- orders.status_id todavía apunta a public.statuses(id) con los ids
-- 5,6,7. La migramos a public.order_statuses(id) sin perder datos.

-- Sanidad: ningún pedido puede quedar con un estado que no exista en
-- order_statuses (4,5,6,7).
update public.orders
set status_id = 5
where status_id not in (4, 5, 6, 7);

alter table public.orders
  drop constraint if exists orders_status_id_fkey;

alter table public.orders
  add constraint orders_status_id_fkey
  foreign key (status_id) references public.order_statuses(id);

-- ---------- ELIMINAR LOS ESTADOS 5,6,7 DE LA TABLA GENÉRICA ----------
-- Ya nadie los usa (solo estaban para pedidos).
delete from public.statuses where id in (5, 6, 7);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.order_statuses enable row level security;

create policy "order_statuses_select" on public.order_statuses
  for select using (auth.uid() is not null);


-- ============================================================
-- BLOQUE: patches\006-data-repair.sql
-- ============================================================

-- ============================================================
-- RUTEX - Reparación de datos tras la separación de estados
-- Ejecutar en Supabase SQL Editor (idempotente)
-- Tras aplicar 005 (order_statuses), las demás tablas siguen
-- apuntando a public.statuses. Este script garantiza que solo
-- existan los estados genéricos (1-4) y que ningún registro de
-- roles/profiles/products/orders quede apuntando a un estado
-- inexistente.
-- ============================================================

-- ---------- 1. ESTADOS GENÉRICOS: dejar solo 1..4 ----------
insert into public.statuses (id, name) values
  (1, 'Activo'),
  (2, 'Inactivo'),
  (3, 'Bloqueado'),
  (4, 'Eliminado')
on conflict (id) do nothing;

delete from public.statuses where id not in (1, 2, 3, 4);

-- ---------- 2. REPARAR DATOS EN TABLAS RELACIONADAS ----------

-- ROLES: cualquier estado inexistente pasa a Activo; eliminados a Eliminado
update public.roles
set status_id = case when deleted_at is null then 1 else 4 end
where status_id not in (1, 2, 3, 4);

-- PROFILES
update public.profiles
set status_id = case when deleted_at is null then 1 else 4 end
where status_id not in (1, 2, 3, 4);

-- PRODUCTOS
update public.products
set status_id = case when deleted_at is null then 1 else 4 end
where status_id not in (1, 2, 3, 4);

-- PEDIDOS: garantizar que sigan en su tabla propia (4,5,6,7)
update public.orders
set status_id = case when deleted_at is null then 5 else 4 end
where status_id not in (4, 5, 6, 7);

-- ---------- 3. ÍNDICES PARA LA NUEVA RELACIÓN ----------
create index if not exists ix_orders_status on public.orders (status_id);

-- ---------- 4. RLS DE order_statuses (idempotente) ----------
alter table public.order_statuses enable row level security;

drop policy if exists "order_statuses_select" on public.order_statuses;
create policy "order_statuses_select" on public.order_statuses
  for select using (auth.uid() is not null);


-- ============================================================
-- BLOQUE: patches\008-cities.sql
-- ============================================================

-- ============================================================
-- RUTEX - Ciudades de la tienda
-- Ejecutar en Supabase SQL Editor (idempotente)
-- Lista simple de ciudades para envíos/entregas. El id es
-- autoincremental (identity) y empieza en 1.
-- ============================================================

create table if not exists public.cities (
  id         int generated by default as identity primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- No permitir duplicados (insensible a mayúsculas/minúsculas)
create unique index if not exists ux_cities_name on public.cities (lower(name));

alter table public.cities enable row level security;

-- Lectura para autenticados; escritura solo administradores
create policy "cities_select" on public.cities
  for select using (auth.uid() is not null);
create policy "cities_insert" on public.cities
  for insert with check (public.is_admin());
create policy "cities_update" on public.cities
  for update using (public.is_admin());
create policy "cities_delete" on public.cities
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\010-pagos-abonos.sql
-- ============================================================

-- ============================================================
-- RUTEX - Cartera: pagos y abonos por pedido
-- Ejecutar en Supabase SQL Editor (idempotente)
--   * pago_estados : estados de un pago (Pendiente/Pagado/En mora)
--   * pagos        : uno por pedido aprobado (PK = order_id)
--   * abonos       : fechas/montos a abonar por pedido + flag pagado
-- Al aprobar un pedido se inserta su fila en pagos y sus abonos.
-- ============================================================

-- ---------- ESTADOS DE PAGO ----------
create table if not exists public.pago_estados (
  id          int primary key,
  name        text not null unique,
  description text
);

insert into public.pago_estados (id, name, description) values
  (1, 'Pendiente', 'Pago al día, pendiente de completarse'),
  (2, 'Pagado', 'Pedido saldado por completo'),
  (3, 'En mora', 'Al menos un abono vencido sin pagar')
on conflict (id) do nothing;

-- ---------- PAGOS (uno por pedido aprobado) ----------
create table if not exists public.pagos (
  order_id       uuid primary key references public.orders(id) on delete cascade,
  estado_pago_id int not null default 1 references public.pago_estados(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- ABONOS (fechas y montos a abonar) ----------
create table if not exists public.abonos (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  fecha_a_abonar date not null,
  monto_a_abonar numeric(12,2) not null check (monto_a_abonar > 0),
  abonado        numeric(12,2) not null default 0 check (abonado >= 0),
  pagado         boolean not null default false,
  fecha_pago     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ix_abonos_order_id on public.abonos (order_id);
create index if not exists ix_abonos_order_fecha on public.abonos (order_id, fecha_a_abonar);

-- ---------- TRIGGER updated_at (genérico) ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pagos_updated on public.pagos;
create trigger trg_pagos_updated
  before update on public.pagos
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_abonos_updated on public.abonos;
create trigger trg_abonos_updated
  before update on public.abonos
  for each row execute function public.touch_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.pago_estados enable row level security;
alter table public.pagos enable row level security;
alter table public.abonos enable row level security;

create policy "pago_estados_select" on public.pago_estados
  for select using (auth.uid() is not null);

create policy "pagos_select" on public.pagos
  for select using (auth.uid() is not null);
create policy "pagos_insert" on public.pagos
  for insert with check (public.is_admin());
create policy "pagos_update" on public.pagos
  for update using (public.is_admin());

create policy "abonos_select" on public.abonos
  for select using (auth.uid() is not null);
create policy "abonos_insert" on public.abonos
  for insert with check (public.is_admin());
create policy "abonos_update" on public.abonos
  for update using (public.is_admin());

-- ---------- BACKFILL: pedidos ya aprobados ----------
-- Crea la fila de pago (Pendiente) y un abono por el total para que
-- aparezcan en cartera y puedan recibir abonos.
insert into public.pagos (order_id, estado_pago_id)
select o.id, 1
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.pagos p where p.order_id = o.id);

insert into public.abonos (order_id, fecha_a_abonar, monto_a_abonar)
select o.id, current_date, o.total
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.abonos a where a.order_id = o.id);


-- ============================================================
-- BLOQUE: patches\011-abono-registros.sql
-- ============================================================

-- ============================================================
-- RUTEX - Histórico de abonos registrados por pedido
-- Un registro por cada vez que se ejecuta "Registrar abono".
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

create table if not exists public.abono_registros (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  monto      numeric(12,2) not null check (monto > 0),
  fecha      timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ix_abono_registros_order_id on public.abono_registros (order_id);
create index if not exists ix_abono_registros_order_fecha on public.abono_registros (order_id, fecha);

alter table public.abono_registros enable row level security;

create policy "abono_registros_select" on public.abono_registros
  for select using (auth.uid() is not null);

create policy "abono_registros_insert" on public.abono_registros
  for insert with check (public.is_admin());

-- BACKFILL: por cada abono ya abonado (pagado o parcial con fecha de pago)
-- crea su registro con el monto aplicado y la fecha de pago.
insert into public.abono_registros (order_id, monto, fecha)
select a.order_id, a.abonado, coalesce(a.fecha_pago, now())
from public.abonos a
where a.abonado > 0
  and not exists (
    select 1 from public.abono_registros r
    where r.order_id = a.order_id and r.monto = a.abonado
  );


-- ============================================================
-- BLOQUE: patches\012-order-delete-cleanup.sql
-- ============================================================

-- ============================================================
-- RUTEX - Limpieza de cartera al borrar un pedido
-- El borrado de pedidos es suave (orders.deleted_at + status 4),
-- así que el ON DELETE CASCADE no se dispara. Este trigger limpia
-- todo lo relacionado (pagos, abonos, abono_registros) cuando el
-- pedido se marca como eliminado.
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

create or replace function public.cleanup_order_cartera()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.abono_registros where order_id = old.id;
    delete from public.abonos where order_id = old.id;
    delete from public.pagos where order_id = old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_cleanup_cartera on public.orders;
create trigger trg_orders_cleanup_cartera
  before update of deleted_at on public.orders
  for each row execute function public.cleanup_order_cartera();

-- LIMPIEZA: pedidos que ya estaban marcados como eliminados antes de
-- instalar el trigger. Elimina los restos de cartera que hayan quedado.
delete from public.abono_registros r
using public.orders o
where r.order_id = o.id and o.deleted_at is not null;

delete from public.abonos a
using public.orders o
where a.order_id = o.id and o.deleted_at is not null;

delete from public.pagos p
using public.orders o
where p.order_id = o.id and o.deleted_at is not null;


-- ============================================================
-- BLOQUE: patches\013-inventories.sql
-- ============================================================

-- ============================================================
-- RUTEX - Inventarios (entradas de stock por producto)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Modelo: al crear un inventario se registra la cantidad que se
-- agrega a cada producto (empieza en 0, el usuario suma/resta).
-- Al guardar, el stock del producto AUMENTA según lo ingresado.
-- Al editar, el stock se ajusta por la diferencia (nueva - anterior).
-- Los items se guardan en un JSON: [{ productId, productName, quantity }].
-- Número de inventario: INV[YYYYMMDD][6 dígitos] => INV20260908000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.inventory_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCIÓN ATOMICA (siguiente número de inventario) ----------
create or replace function public.next_inventory_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.inventory_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.inventory_counters.last_number + 1
  returning 'INV' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_inventory_number() to anon, authenticated, service_role;

-- ---------- TABLA DE INVENTARIOS ----------
create table if not exists public.inventories (
  id               uuid primary key default gen_random_uuid(),
  inventory_number text not null,
  items            jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create unique index if not exists ux_inventories_number on public.inventories (inventory_number);
create index if not exists ix_inventories_created on public.inventories (created_at);

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.inventory_counters (day, last_number)
select current_date, coalesce(max((regexp_match(inventory_number, '^INV[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.inventories
where inventory_number ~ '^INV[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.inventories enable row level security;

-- Lectura para autenticados; escritura solo administradores. Sin borrado.
create policy "inventories_select" on public.inventories
  for select using (auth.uid() is not null);
create policy "inventories_insert" on public.inventories
  for insert with check (public.is_admin());
create policy "inventories_update" on public.inventories
  for update using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\014-entregas.sql
-- ============================================================

-- ============================================================
-- RUTEX - Entregas (Almacén)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Al aprobar un pedido (status 6) se crea una fila en `deliveries`
-- con estado 1 (En almacén). La sección Almacén permite avanzar el
-- estado (En almacén -> En ruta -> Entregado) una sola vez, sin revertir.
-- Si el pedido se marca como eliminado su entrega también se borra
-- (se extiende el trigger de limpieza de cartera del patch 012).
-- ============================================================

-- ---------- ESTADOS DE ENTREGA ----------
create table if not exists public.delivery_statuses (
  id          int primary key,
  name        text not null unique,
  description text
);

insert into public.delivery_statuses (id, name, description) values
  (1, 'En almacén', 'Pedido aprobado e ingresado al almacén, pendiente de despacho'),
  (2, 'En ruta', 'Despachado, en camino al cliente'),
  (3, 'Entregado', 'Entregado al cliente')
on conflict (id) do nothing;

-- Lectura de los estados para autenticados. Sin esta política, el join
-- `delivery_statuses!inner` del API de Almacén queda sin filas (RLS) y la
-- sección se ve vacía aunque haya entregas.
alter table public.delivery_statuses enable row level security;
drop policy if exists "delivery_statuses_select" on public.delivery_statuses;
create policy "delivery_statuses_select" on public.delivery_statuses
  for select using (auth.uid() is not null);

-- ---------- TABLA DE ENTREGAS ----------
create table if not exists public.deliveries (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status_id  int not null default 1 references public.delivery_statuses(id),
  entered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists ux_deliveries_order on public.deliveries (order_id);
create index if not exists ix_deliveries_entered on public.deliveries (entered_at);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.deliveries enable row level security;

-- Lectura para autenticados; escritura solo administradores. Sin borrado.
create policy "deliveries_select" on public.deliveries
  for select using (auth.uid() is not null);
create policy "deliveries_insert" on public.deliveries
  for insert with check (public.is_admin());
create policy "deliveries_update" on public.deliveries
  for update using (public.is_admin());

-- ---------- LIMPIEZA AL BORRAR UN PEDIDO Aprobado ----------
-- Se extiende la función del patch 012 para que, además de cartera,
-- elimine la entrega del pedido que se marca como eliminado (soft delete).
create or replace function public.cleanup_order_cartera()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.abono_registros where order_id = old.id;
    delete from public.abonos where order_id = old.id;
    delete from public.pagos where order_id = old.id;
    delete from public.deliveries where order_id = old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_cleanup_cartera on public.orders;
create trigger trg_orders_cleanup_cartera
  before update of deleted_at on public.orders
  for each row execute function public.cleanup_order_cartera();

-- LIMPIEZA: entregas huérfanas de pedidos ya eliminados.
delete from public.deliveries d
using public.orders o
where d.order_id = o.id and o.deleted_at is not null;

-- BACKFILL: entregas para pedidos ya aprobados que no tienen una
-- (los aprobados antes de instalar este patch). entered_at = hora de aprobación.
insert into public.deliveries (order_id, status_id, entered_at)
select o.id, 1, coalesce(o.updated_at, o.created_at)
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.deliveries d where d.order_id = o.id)
on conflict (order_id) do nothing;


-- ============================================================
-- BLOQUE: patches\015-entregas-backfill.sql
-- ============================================================

-- ============================================================
-- RUTEX - Backfill de entregas para pedidos ya aprobados
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Crea la entrega (status 1 = En almacén) para pedidos aprobados
-- (status 6) que se aprobaron antes de instalar el patch 014 y
-- quedaron sin fila en `deliveries`. entered_at = hora de aprobación.
-- ============================================================

insert into public.deliveries (order_id, status_id, entered_at)
select o.id, 1, coalesce(o.updated_at, o.created_at)
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.deliveries d where d.order_id = o.id)
on conflict (order_id) do nothing;


-- ============================================================
-- BLOQUE: patches\016-delivery-statuses-rls.sql
-- ============================================================

-- ============================================================
-- RUTEX - Fix RLS en delivery_statuses (Almacén vacío)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- La sección Almacén aparecía vacía (0 entregas) pese a tener filas
-- en `deliveries`, porque la tabla `delivery_statuses` quedó con RLS
-- activa (default del proyecto) sin política de SELECT: el join
-- `delivery_statuses!inner(name)` del GET /api/deliveries se filtra a
-- cero sin devolver error.
-- ============================================================
alter table public.delivery_statuses enable row level security;

drop policy if exists "delivery_statuses_select" on public.delivery_statuses;
create policy "delivery_statuses_select" on public.delivery_statuses
  for select using (auth.uid() is not null);


-- ============================================================
-- BLOQUE: patches\017-inventories-total-value.sql
-- ============================================================

-- ============================================================
-- RUTEX - Valor de inventario
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Agrega la columna total_value a public.inventories con el
-- valor total del inventario = suma(precio de venta * cantidad).
-- El valor se calcula en el servidor al crear/editar (snapshot)
-- con los precios de venta vigentes en ese momento.
-- ============================================================

-- ---------- COLUMNA ----------
alter table public.inventories
  add column if not exists total_value numeric not null default 0;

-- ---------- BACKFILL: recalcular valor de inventarios existentes ----------
with exploded as (
  select
    i.id,
    (item->>'productId')::uuid            as product_id,
    greatest((item->>'quantity')::numeric, 0) as quantity
  from public.inventories i
  cross join lateral jsonb_array_elements(i.items) as item
)
update public.inventories inv
set total_value = coalesce((
  select sum(p.price * e.quantity)
  from exploded e
  join public.products p on p.id = e.product_id
  where e.id = inv.id
), 0)
where exists (select 1 from exploded e2 where e2.id = inv.id);


-- ============================================================
-- BLOQUE: patches\018-clients.sql
-- ============================================================

-- ============================================================
-- RUTEX - Clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Directorio de clientes. La cédula se guarda SIN guiones.
-- Las coordenadas de ubicación (lat/lng) son opcionales y se
-- eligen desde el mapa (Leaflet) o manualmente.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text not null,
  cedula     text,
  address    text,
  city       text,
  latitude   double precision,
  longitude  double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_clients_full_name on public.clients (full_name);
create index if not exists ix_clients_cedula on public.clients (cedula);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.clients enable row level security;

-- Lectura para autenticados; escritura/borrado solo administradores.
create policy "clients_select" on public.clients
  for select using (auth.uid() is not null);
create policy "clients_insert" on public.clients
  for insert with check (public.is_admin());
create policy "clients_update" on public.clients
  for update using (public.is_admin());
create policy "clients_delete" on public.clients
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\019-clients-status.sql
-- ============================================================

-- ============================================================
-- RUTEX - Estados de clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Agrega status_id (referencia a public.statuses: 1=Activo,
-- 2=Inactivo, 3=Bloqueado, 4=Eliminado) y deleted_at para el
-- borrado lógico de clientes. El listado no muestra los que
-- están en estado 4 (Eliminado).
-- ============================================================

-- ---------- COLUMNAS ----------
alter table public.clients
  add column if not exists status_id int not null default 1 references public.statuses(id),
  add column if not exists deleted_at timestamptz;

-- ---------- ÍNDICE ----------
create index if not exists ix_clients_status on public.clients (status_id);

-- ---------- BACKFILL: los existentes quedan Activos ----------
update public.clients set status_id = 1 where status_id is null;
alter table public.clients alter column status_id set default 1;
alter table public.clients alter column status_id set not null;


-- ============================================================
-- BLOQUE: patches\021-products-barcode.sql
-- ============================================================

-- ============================================================
-- RUTEX - Código de barras en productos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Campo opcional para el código de barras del producto.
-- Se guarda tal cual se escanea/escribe (se limpia en la API).
alter table public.products
  add column if not exists barcode text;

-- Índice para búsquedas por código de barras (no único: el mismo
-- código puede repetirse en variantes del mismo producto).
create index if not exists ix_products_barcode on public.products(barcode);


-- ============================================================
-- BLOQUE: patches\022-orders-proforma-url.sql
-- ============================================================

-- 022-orders-proforma-url.sql
-- Guarda la URL de la proforma de cada pedido para no regenerarla/subirla
-- en cada mensaje (WhatsApp). La proforma se genera y guarda al crear el pedido
-- (server-side en POST /api/orders) y se reutiliza al enviar mensajes.
alter table public.orders
  add column if not exists proforma_url text;


-- ============================================================
-- BLOQUE: patches\023-routes.sql
-- ============================================================

-- ============================================================
-- RUTEX - Rutas de visita/entrega a clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Modelo: una ruta agrupa clientes a visitar (visita o entregas).
-- La ruta nace 'en_proceso'; cada cliente dentro de la ruta arranca
-- 'pendiente' y pasa a 'completada'/'cancelada' con su observacion.
-- Número de ruta: RUT[YYYYMMDD][6 dígitos] => RUT20260910000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.route_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCION ATOMICA (siguiente número de ruta) ----------
create or replace function public.next_route_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.route_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.route_counters.last_number + 1
  returning 'RUT' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_route_number() to anon, authenticated, service_role;

-- ---------- TABLA DE RUTAS ----------
create table if not exists public.routes (
  id         uuid primary key default gen_random_uuid(),
  route_code text not null,
  type       text not null check (type in ('visita', 'entregas')),
  status     text not null default 'en_proceso' check (status in ('en_proceso', 'completada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists ux_routes_code on public.routes (route_code);
create index if not exists ix_routes_created on public.routes (created_at);

-- ---------- TABLA DE CLIENTES POR RUTA ----------
create table if not exists public.route_clients (
  id          uuid primary key default gen_random_uuid(),
  route_id    uuid not null references public.routes (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  visit_order int not null default 0,
  status      text not null default 'pendiente' check (status in ('pendiente', 'completada', 'cancelada')),
  observation text,
  created_at  timestamptz not null default now(),
  unique (route_id, client_id)
);

create index if not exists ix_route_clients_route on public.route_clients (route_id);
create index if not exists ix_route_clients_client on public.route_clients (client_id);

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.route_counters (day, last_number)
select current_date, coalesce(max((regexp_match(route_code, '^RUT[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.routes
where route_code ~ '^RUT[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.routes enable row level security;
alter table public.route_clients enable row level security;

-- Lectura para autenticados; escritura solo administradores.
create policy "routes_select" on public.routes
  for select using (auth.uid() is not null);
create policy "routes_insert" on public.routes
  for insert with check (public.is_admin());
create policy "routes_update" on public.routes
  for update using (public.is_admin());

create policy "route_clients_select" on public.route_clients
  for select using (auth.uid() is not null);
create policy "route_clients_insert" on public.route_clients
  for insert with check (public.is_admin());
create policy "route_clients_update" on public.route_clients
  for update using (public.is_admin());
create policy "route_clients_delete" on public.route_clients
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\024-routes-delete.sql
-- ============================================================

-- ============================================================
-- RUTEX - Permiso de eliminar rutas
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- routes.route_clients ya se borra en cascada (FK on delete cascade);
-- falta la política DELETE sobre public.routes para que el admin
-- pueda eliminar la ruta completa.
-- ============================================================

-- `create policy` no es idempotente, así que primero se elimina la política
-- si ya existe y se vuelve a crear (evita error al repetir el script).
drop policy if exists "routes_delete" on public.routes;

create policy "routes_delete" on public.routes
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\025-suppliers.sql
-- ============================================================

-- ============================================================
-- RUTEX - Proveedores
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Directorio de proveedores. Solo la dirección, el nombre del
-- propietario y el correo electrónico son opcionales; el nombre,
-- el RUC y el teléfono son obligatorios. El borrado es lógico
-- (status_id=4 Eliminado + deleted_at), igual que clientes.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  ruc        text not null,
  phone      text not null,
  address    text,
  owner_name text,
  email      text,
  status_id  int  not null default 1 references public.statuses(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_suppliers_name on public.suppliers (name);
create index if not exists ix_suppliers_ruc on public.suppliers (ruc);
create index if not exists ix_suppliers_status on public.suppliers (status_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.suppliers enable row level security;

-- Lectura para autenticados; escritura/borrado solo administradores.
create policy "suppliers_select" on public.suppliers
  for select using (auth.uid() is not null);
create policy "suppliers_insert" on public.suppliers
  for insert with check (public.is_admin());
create policy "suppliers_update" on public.suppliers
  for update using (public.is_admin());
create policy "suppliers_delete" on public.suppliers
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\026-mermas.sql
-- ============================================================

-- ============================================================
-- RUTEX - Mermas (bajas de stock por producto)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Modelo: al crear una merma se registra la cantidad que se da de
-- baja a cada producto (empieza en 0, el usuario suma/resta).
-- Al guardar, el stock del producto DISMINUYE según lo ingresado.
-- Al editar, el stock se ajusta por la diferencia (anterior - nueva).
-- Al eliminar, el stock vuelve a sumarse (se revierte lo restado).
-- Los items se guardan en un JSON con el nombre del producto, la
-- cantidad restada y el valor de compra y venta vigentes:
--   [{ productId, productName, quantity, purchasePrice, sellPrice }]
-- Número de merma: MER[YYYYMMDD][6 dígitos] => MER20260908000001
-- ============================================================

-- ---------- MOTIVOS DE MERMA (catálogo) ----------
create table if not exists public.merma_motivos (
  id         int  generated by default as identity primary key,
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- Semilla con los motivos genéricos más comunes (no reintroduce duplicados).
insert into public.merma_motivos (name)
select unnest(array[
  'Caducado o vencido',
  'Dañado o roto',
  'Devolución en mal estado',
  'Robo o pérdida',
  'Error de conteo / inventario',
  'Merma por manipulación',
  'Exhibición o muestra',
  'Consumo interno',
  'Producto obsoleto o descontinuado',
  'Fuga, derrame o contaminación',
  'Rechazo de control de calidad',
  'Descomposición o deterioro'
])
on conflict (name) do nothing;

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.merma_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCIÓN ATOMICA (siguiente número de merma) ----------
create or replace function public.next_merma_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.merma_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.merma_counters.last_number + 1
  returning 'MER' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_merma_number() to anon, authenticated, service_role;

-- ---------- TABLA DE MERMAS ----------
create table if not exists public.mermas (
  id           uuid primary key default gen_random_uuid(),
  merma_number text not null,
  motivo_id    int  not null references public.merma_motivos(id),
  items        jsonb not null default '[]'::jsonb,
  total_value  numeric not null default 0,
  observation  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create unique index if not exists ux_mermas_number on public.mermas (merma_number);
create index if not exists ix_mermas_created on public.mermas (created_at);
create index if not exists ix_mermas_motivo on public.mermas (motivo_id);

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.merma_counters (day, last_number)
select current_date, coalesce(max((regexp_match(merma_number, '^MER[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.mermas
where merma_number ~ '^MER[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.mermas enable row level security;

-- Lectura para autenticados; escritura y borrado solo administradores.
create policy "mermas_select" on public.mermas
  for select using (auth.uid() is not null);
create policy "mermas_insert" on public.mermas
  for insert with check (public.is_admin());
create policy "mermas_update" on public.mermas
  for update using (public.is_admin());
create policy "mermas_delete" on public.mermas
  for delete using (public.is_admin());

-- ---------- RLS MOTIVOS ----------
alter table public.merma_motivos enable row level security;

create policy "merma_motivos_select" on public.merma_motivos
  for select using (auth.uid() is not null);
create policy "merma_motivos_insert" on public.merma_motivos
  for insert with check (public.is_admin());
create policy "merma_motivos_update" on public.merma_motivos
  for update using (public.is_admin());
create policy "merma_motivos_delete" on public.merma_motivos
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\027-gastos.sql
-- ============================================================

-- ============================================================
-- RUTEX - Gastos
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Registro de gastos de la tienda: título, comentario opcional,
-- monto y un recibo opcional (imagen o PDF) que se sube a
-- Supabase Storage vía POST /api/gastos/receipts (carpeta "gastos").
-- El borrado es físico; antes de borrar el gasto la API elimina
-- también el archivo del recibo del storage.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.gastos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  observation  text,
  amount       numeric not null default 0 check (amount >= 0),
  receipt_path text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_gastos_created on public.gastos (created_at);
create index if not exists ix_gastos_title on public.gastos (title);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.gastos enable row level security;

-- Lectura para autenticados; escritura y borrado solo administradores.
create policy "gastos_select" on public.gastos
  for select using (auth.uid() is not null);
create policy "gastos_insert" on public.gastos
  for insert with check (public.is_admin());
create policy "gastos_update" on public.gastos
  for update using (public.is_admin());
create policy "gastos_delete" on public.gastos
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\028-compras.sql
-- ============================================================

-- ============================================================
-- RUTEX - Compras
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Registro de compras hechas a proveedores: título, proveedor
-- (con snapshot del nombre para conservarlo si el proveedor se
-- elimina), comentario opcional, monto total y un recibo opcional
-- (imagen o PDF) que se sube a Supabase Storage vía
-- POST /api/compras/receipts (carpeta "compras").
-- El borrado es físico; antes de borrar la compra la API elimina
-- también el archivo del recibo del storage.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.compras (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  supplier_id   uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  observation   text,
  amount        numeric not null default 0 check (amount >= 0),
  receipt_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_compras_created on public.compras (created_at);
create index if not exists ix_compras_title on public.compras (title);
create index if not exists ix_compras_supplier on public.compras (supplier_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.compras enable row level security;

-- Lectura para autenticados; escritura y borrado solo administradores.
create policy "compras_select" on public.compras
  for select using (auth.uid() is not null);
create policy "compras_insert" on public.compras
  for insert with check (public.is_admin());
create policy "compras_update" on public.compras
  for update using (public.is_admin());
create policy "compras_delete" on public.compras
  for delete using (public.is_admin());


-- ============================================================
-- BLOQUE: patches\029-orders-purchase-price.sql
-- ============================================================

-- ============================================================
-- RUTEX - Snapshot del precio de compra en pedidos (reportes)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Los pedidos guardan sus items en jsonb sin el precio de compra.
-- Este patch rellena los pedidos existentes con el purchase_price
-- vigente de cada producto como respaldo (backfill); para los
-- pedidos NUEVOS el snapshot lo hace server-side POST /api/orders,
-- igual que mermas. Con esto el reporte de ganancia compara el
-- precio de compra real del momento con el precio de venta.
-- Idempotente: no toca items que ya tengan purchasePrice.
-- ============================================================

update public.orders o
set items = sub.items
from (
  select
    o2.id,
    coalesce(
      jsonb_agg(
        case
          when it.value ? 'purchasePrice' then it.value
          else it.value || jsonb_build_object(
            'purchasePrice',
            coalesce(
              (select p.purchase_price from public.products p where p.id = (it.value ->> 'productId')::uuid),
              0
            )
          )
        end
        order by ord
      ) filter (where it.value is not null),
      '[]'::jsonb
    ) as items
  from public.orders o2
  cross join lateral jsonb_array_elements(o2.items) with ordinality as it(value, ord)
  where o2.items is not null and jsonb_typeof(o2.items) = 'array'
  group by o2.id
) sub
where o.id = sub.id;


-- ============================================================
-- BLOQUE: patches\030-orders-customer-address.sql
-- ============================================================

-- 030-orders-customer-address.sql
-- Snapshot de la dirección del cliente al crear el pedido (se muestra en el
-- recibo térmico y en la proforma). El cliente de pedidos internos envía su
-- dirección registrada; los pedidos del carrito (nombre/teléfono libre) quedan null.
alter table public.orders
  add column if not exists customer_address text;


-- ============================================================
-- BLOQUE: patches\031-store-payment-plans.sql
-- ============================================================

-- ============================================================
-- RUTEX - Pagos en cuotas (configuración de tienda)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Agrega a store_profile la bandera `payment_plans_enabled`.
-- Si está en false, los formularios de pedido solo ofrecen la
-- modalidad "De contado" (se ocultan las cuotas 2/4) y la API
-- de creación de pedidos fuerza contado.
-- Por defecto queda habilitado (true) para no alterar el
-- comportamiento actual de las tiendas existentes.
-- ============================================================

alter table public.store_profile
  add column if not exists payment_plans_enabled boolean not null default true;


-- ============================================================
-- BLOQUE: patches\032-role-permissions.sql
-- ============================================================

-- ============================================================
-- 032 - Permisos por rol
-- Agrega una columna jsonb `permissions` a `roles` donde se guarda
-- el array de claves "modulo:accion" que el rol puede ejecutar.
-- El rol 'admin' siempre tiene acceso total (bypass), por lo que
-- no necesita permisos en la columna. Las escrituras autorizadas
-- se ejecutan con el service role desde la API (guardas por permiso),
-- con lo que el RLS actual (solo admin puede escribir directo) se
-- mantiene como red de seguridad.
-- Idempotente.
-- ============================================================

alter table public.roles
  add column if not exists permissions jsonb not null default '[]'::jsonb;


-- ============================================================
-- BLOQUE: patches\033-indexes-performance.sql
-- ============================================================

-- ============================================================
-- 033 - Índices de rendimiento
-- Acelera las consultas de los listados (ahora paginadas
-- server-side), los reportes y el dashboard. Todos los índices
-- son idempotentes (CREATE INDEX IF NOT EXISTS) y no afectan datos.
-- ============================================================

-- Búsqueda de productos por nombre (listado + reportes).
create index if not exists idx_products_name on public.products (name);

-- Clientes: búsqueda por teléfono (empieza por) y cédula.
create index if not exists idx_clients_phone on public.clients (phone);
create index if not exists idx_clients_cedula on public.clients (cedula);

-- Pedidos: filtros de estado + fecha (listado, reportes, dashboard).
create index if not exists idx_orders_status_id on public.orders (status_id);
create index if not exists idx_orders_created_at on public.orders (created_at);
create index if not exists idx_orders_status_created
  on public.orders (status_id, created_at);
create index if not exists idx_orders_customer_name on public.orders (customer_name);

-- Abonos: la cartera consulta cuotas por 'pagado' y 'fecha_a_abonar',
-- y el reporte de cartera filtra cuotas por fecha.
create index if not exists idx_abonos_pagado on public.abonos (pagado);
create index if not exists idx_abonos_fecha_abonar on public.abonos (fecha_a_abonar);
create index if not exists idx_abonos_order_id on public.abonos (order_id);

-- Entregas: la vista filtra por estado y ordena por fecha de ingreso.
create index if not exists idx_deliveries_status_id on public.deliveries (status_id);
create index if not exists idx_deliveries_entered_at on public.deliveries (entered_at);

-- Pagos: la cartera/dashboard consultan pedidos con pagos.
create index if not exists idx_pagos_order_id on public.pagos (order_id);

-- Gastos y compras: los listados filtran y ordenan por fecha.
create index if not exists idx_gastos_created_at on public.gastos (created_at);
create index if not exists idx_compras_created_at on public.compras (created_at);

-- Mermas: listado por fecha.
create index if not exists idx_mermas_created_at on public.mermas (created_at);

-- Inventarios: listado por fecha.
create index if not exists idx_inventories_created_at on public.inventories (created_at);

-- Rutas: listado por estado y fecha de creación.
create index if not exists idx_routes_status on public.routes (status);
create index if not exists idx_routes_created_at on public.routes (created_at);


-- ============================================================
-- BLOQUE: patches\034-bank-accounts-encrypt-rls.sql
-- ============================================================

-- ============================================================
-- 034 - CUENTAS BANCARIAS: lectura restringida a administradores
-- ============================================================
-- Los números de cuenta se cifran en reposo server-side (AES-256-GCM,
-- clave en env var BANK_ACCOUNT_ENC_KEY, ver src/lib/encrypt.ts).
-- Este patch cierra el vector de lectura directa: antes CUALQUIER usuario
-- autenticado podía leer los números completos vía PostgREST
-- (policy bank_select = using (auth.uid() is not null)).
--
-- Ahora solo el admin puede leer la tabla directamente. El carrito público
-- y las proformas siguen funcionando porque se sirven por /api/catalog y
-- /api/orders con service role (no aplica RLS).
--
-- Idempotente (drop + create).
-- ============================================================

drop policy if exists "bank_select" on public.bank_accounts;
create policy "bank_select" on public.bank_accounts
  for select using (public.is_admin());

-- ============================================================
-- FIN 034
-- ============================================================


-- =====================================================================
-- 4) STORAGE + PRIMER ADMINISTRADOR (bootstrap para cliente nuevo)
-- =====================================================================

-- 4.1) Bucket de storage público (nombre por defecto: rutex).
--      Ajustar si vas a usar otro nombre de bucket en las env vars.
insert into storage.buckets (id, name, public)
values ('rutex', 'rutex', true)
on conflict (id) do nothing;

-- 4.2) Lectura pública de los objetos del bucket (imágenes, proformas,
--      recibos). Los uploads/borrados se hacen con service role.
drop policy if exists "rutex_public_read" on storage.objects;
create policy "rutex_public_read" on storage.objects
  for select using (bucket_id = 'rutex');

-- 4.3) Bootstrap del primer administrador.
--      IMPORTANTE: ejecutar DESPUÉS de crear el primer usuario en
--      "Authentication > Users > Add user". Promueve a ADMIN al usuario
--      más antiguo del proyecto SOLO si todavía no existe ningún admin
--      activo. Es seguro correrlo varias veces.
do $$
declare admin_role uuid;
begin
  select id into admin_role
  from public.roles
  where lower(regexp_replace(lower(name), '[^a-z]', '', 'g')) = 'admin'
  limit 1;

  if admin_role is not null and not exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where lower(regexp_replace(lower(r.name), '[^a-z]', '', 'g')) = 'admin'
      and p.status_id = 1
  ) then
    update public.profiles p
    set role_id = admin_role,
        status_id = 1
    where p.id = (
      select u.id
      from auth.users u
      order by u.created_at asc
      limit 1
    );
  end if;
end $$;

-- 4.4) Verificación (debe devolver al menos 1 fila con el usuario admin).
select p.username, p.email, r.name as rol, s.name as estado
from public.profiles p
join public.roles r on r.id = p.role_id
join public.statuses s on s.id = p.status_id
where lower(regexp_replace(lower(r.name), '[^a-z]', '', 'g')) = 'admin';

-- =====================================================================
-- FIN DE LA INSTALACIÓN. Si la verificación (4.4) no devuelve filas,
-- crea el primer usuario en Auth > Users y vuelve a ejecutar solo el
-- bloque 4.3.
-- =====================================================================

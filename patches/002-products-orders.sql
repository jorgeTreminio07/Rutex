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

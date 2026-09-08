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
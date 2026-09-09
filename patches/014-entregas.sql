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
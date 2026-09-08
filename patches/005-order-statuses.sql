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
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
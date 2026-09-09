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
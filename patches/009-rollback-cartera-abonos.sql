-- ============================================================
-- RUTEX - ROLLBACK de 009-cartera-abonos.sql
-- Ejecutar en Supabase SQL Editor (idempotente)
-- Revierte lo que hizo el patch 009:
--   * elimina los estados 8=Pagado y 9=En mora de order_statuses
--   * elimina la tabla order_quotas (cuotas/abonos) y su función
-- IMPORTANTE:
--   * Los pedidos que quedaron en Pagado/En mora (8/9) vuelven a Aprobado (6).
--   * Se BORRAN todos los abonos/cuotas registrados en order_quotas.
-- ============================================================

-- 1) Pedidos en 8/9 vuelven a Aprobado (6) para no violar la FK
--    orders_status_id_fkey al eliminar los estados.
update public.orders
set status_id = 6,
    updated_at = now()
where status_id in (8, 9);

-- 2) Elimina la tabla de cuotas/abonos (casca políticas RLS, índices y trigger).
drop table if exists public.order_quotas;

-- 3) Elimina la función que mantenía updated_at de las cuotas.
drop function if exists public.touch_order_quotas();

-- 4) Elimina los estados que agregó el 009 (ya sin pedidos referenciándolos).
delete from public.order_statuses where id in (8, 9);
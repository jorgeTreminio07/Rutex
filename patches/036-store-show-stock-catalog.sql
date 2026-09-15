-- ============================================================
-- RUTEX - Mostrar stock en catálogo (configuración de tienda)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Agrega a store_profile la bandera `show_stock_in_catalog`.
-- Si está en true, el catálogo público muestra cuántas unidades
-- hay por producto (tarjeta y modal de detalle).
-- Si está en false (por defecto), se comporta como ahora:
-- solo el badge "Agotado" cuando no hay stock.
-- ============================================================

alter table public.store_profile
  add column if not exists show_stock_in_catalog boolean not null default false;
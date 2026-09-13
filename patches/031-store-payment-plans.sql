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
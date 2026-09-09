-- ============================================================
-- RUTEX - LIMPIAR TODA LA INFORMACIÓN (mantiene estructura)
-- Ejecutar en Supabase SQL Editor
--
-- BORRA todos los registros de operación en este orden:
--   abono_registros, abonos, pagos, deliveries, orders,
--   inventories, products, order_counters, inventory_counters
--
-- CONSERVA (con sus datos): users, profiles, roles,
--   clients, cities, statuses, order_statuses,
--   delivery_statuses, pago_estados
--
-- ADVERTENCIA: esta acción NO se puede deshacer.
-- ============================================================

begin;

truncate table
  public.abono_registros,
  public.abonos,
  public.pagos,
  public.deliveries,
  public.orders,
  public.inventories,
  public.products,
  public.order_counters,
  public.inventory_counters
restart identity cascade;

commit;
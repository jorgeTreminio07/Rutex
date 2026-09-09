-- ============================================================
-- RUTEX - Fix RLS en delivery_statuses (Almacén vacío)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- La sección Almacén aparecía vacía (0 entregas) pese a tener filas
-- en `deliveries`, porque la tabla `delivery_statuses` quedó con RLS
-- activa (default del proyecto) sin política de SELECT: el join
-- `delivery_statuses!inner(name)` del GET /api/deliveries se filtra a
-- cero sin devolver error.
-- ============================================================
alter table public.delivery_statuses enable row level security;

drop policy if exists "delivery_statuses_select" on public.delivery_statuses;
create policy "delivery_statuses_select" on public.delivery_statuses
  for select using (auth.uid() is not null);
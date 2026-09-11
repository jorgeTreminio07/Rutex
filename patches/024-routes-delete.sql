-- ============================================================
-- RUTEX - Permiso de eliminar rutas
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- routes.route_clients ya se borra en cascada (FK on delete cascade);
-- falta la política DELETE sobre public.routes para que el admin
-- pueda eliminar la ruta completa.
-- ============================================================

-- `create policy` no es idempotente, así que primero se elimina la política
-- si ya existe y se vuelve a crear (evita error al repetir el script).
drop policy if exists "routes_delete" on public.routes;

create policy "routes_delete" on public.routes
  for delete using (public.is_admin());
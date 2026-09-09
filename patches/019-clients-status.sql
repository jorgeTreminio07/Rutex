-- ============================================================
-- RUTEX - Estados de clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Agrega status_id (referencia a public.statuses: 1=Activo,
-- 2=Inactivo, 3=Bloqueado, 4=Eliminado) y deleted_at para el
-- borrado lógico de clientes. El listado no muestra los que
-- están en estado 4 (Eliminado).
-- ============================================================

-- ---------- COLUMNAS ----------
alter table public.clients
  add column if not exists status_id int not null default 1 references public.statuses(id),
  add column if not exists deleted_at timestamptz;

-- ---------- ÍNDICE ----------
create index if not exists ix_clients_status on public.clients (status_id);

-- ---------- BACKFILL: los existentes quedan Activos ----------
update public.clients set status_id = 1 where status_id is null;
alter table public.clients alter column status_id set default 1;
alter table public.clients alter column status_id set not null;
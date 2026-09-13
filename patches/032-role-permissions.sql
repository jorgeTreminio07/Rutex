-- ============================================================
-- 032 - Permisos por rol
-- Agrega una columna jsonb `permissions` a `roles` donde se guarda
-- el array de claves "modulo:accion" que el rol puede ejecutar.
-- El rol 'admin' siempre tiene acceso total (bypass), por lo que
-- no necesita permisos en la columna. Las escrituras autorizadas
-- se ejecutan con el service role desde la API (guardas por permiso),
-- con lo que el RLS actual (solo admin puede escribir directo) se
-- mantiene como red de seguridad.
-- Idempotente.
-- ============================================================

alter table public.roles
  add column if not exists permissions jsonb not null default '[]'::jsonb;
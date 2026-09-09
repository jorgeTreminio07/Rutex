-- ============================================================
-- RUTEX - Clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Directorio de clientes. La cédula se guarda SIN guiones.
-- Las coordenadas de ubicación (lat/lng) son opcionales y se
-- eligen desde el mapa (Leaflet) o manualmente.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text not null,
  cedula     text,
  address    text,
  city       text,
  latitude   double precision,
  longitude  double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_clients_full_name on public.clients (full_name);
create index if not exists ix_clients_cedula on public.clients (cedula);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.clients enable row level security;

-- Lectura para autenticados; escritura/borrado solo administradores.
create policy "clients_select" on public.clients
  for select using (auth.uid() is not null);
create policy "clients_insert" on public.clients
  for insert with check (public.is_admin());
create policy "clients_update" on public.clients
  for update using (public.is_admin());
create policy "clients_delete" on public.clients
  for delete using (public.is_admin());
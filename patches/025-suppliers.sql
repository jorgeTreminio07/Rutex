-- ============================================================
-- RUTEX - Proveedores
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Directorio de proveedores. Solo la dirección, el nombre del
-- propietario y el correo electrónico son opcionales; el nombre,
-- el RUC y el teléfono son obligatorios. El borrado es lógico
-- (status_id=4 Eliminado + deleted_at), igual que clientes.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.suppliers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  ruc        text not null,
  phone      text not null,
  address    text,
  owner_name text,
  email      text,
  status_id  int  not null default 1 references public.statuses(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_suppliers_name on public.suppliers (name);
create index if not exists ix_suppliers_ruc on public.suppliers (ruc);
create index if not exists ix_suppliers_status on public.suppliers (status_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.suppliers enable row level security;

-- Lectura para autenticados; escritura/borrado solo administradores.
create policy "suppliers_select" on public.suppliers
  for select using (auth.uid() is not null);
create policy "suppliers_insert" on public.suppliers
  for insert with check (public.is_admin());
create policy "suppliers_update" on public.suppliers
  for update using (public.is_admin());
create policy "suppliers_delete" on public.suppliers
  for delete using (public.is_admin());
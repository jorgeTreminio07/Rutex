-- ============================================================
-- RUTEX - Compras
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Registro de compras hechas a proveedores: título, proveedor
-- (con snapshot del nombre para conservarlo si el proveedor se
-- elimina), comentario opcional, monto total y un recibo opcional
-- (imagen o PDF) que se sube a Supabase Storage vía
-- POST /api/compras/receipts (carpeta "compras").
-- El borrado es físico; antes de borrar la compra la API elimina
-- también el archivo del recibo del storage.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.compras (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  supplier_id   uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  observation   text,
  amount        numeric not null default 0 check (amount >= 0),
  receipt_path  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_compras_created on public.compras (created_at);
create index if not exists ix_compras_title on public.compras (title);
create index if not exists ix_compras_supplier on public.compras (supplier_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.compras enable row level security;

-- Lectura para autenticados; escritura y borrado solo administradores.
create policy "compras_select" on public.compras
  for select using (auth.uid() is not null);
create policy "compras_insert" on public.compras
  for insert with check (public.is_admin());
create policy "compras_update" on public.compras
  for update using (public.is_admin());
create policy "compras_delete" on public.compras
  for delete using (public.is_admin());
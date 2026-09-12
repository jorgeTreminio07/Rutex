-- ============================================================
-- RUTEX - Gastos
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Registro de gastos de la tienda: título, comentario opcional,
-- monto y un recibo opcional (imagen o PDF) que se sube a
-- Supabase Storage vía POST /api/gastos/receipts (carpeta "gastos").
-- El borrado es físico; antes de borrar el gasto la API elimina
-- también el archivo del recibo del storage.
-- ============================================================

-- ---------- TABLA ----------
create table if not exists public.gastos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  observation  text,
  amount       numeric not null default 0 check (amount >= 0),
  receipt_path text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- ---------- ÍNDICES ----------
create index if not exists ix_gastos_created on public.gastos (created_at);
create index if not exists ix_gastos_title on public.gastos (title);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.gastos enable row level security;

-- Lectura para autenticados; escritura y borrado solo administradores.
create policy "gastos_select" on public.gastos
  for select using (auth.uid() is not null);
create policy "gastos_insert" on public.gastos
  for insert with check (public.is_admin());
create policy "gastos_update" on public.gastos
  for update using (public.is_admin());
create policy "gastos_delete" on public.gastos
  for delete using (public.is_admin());
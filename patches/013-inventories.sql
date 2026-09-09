-- ============================================================
-- RUTEX - Inventarios (entradas de stock por producto)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Modelo: al crear un inventario se registra la cantidad que se
-- agrega a cada producto (empieza en 0, el usuario suma/resta).
-- Al guardar, el stock del producto AUMENTA según lo ingresado.
-- Al editar, el stock se ajusta por la diferencia (nueva - anterior).
-- Los items se guardan en un JSON: [{ productId, productName, quantity }].
-- Número de inventario: INV[YYYYMMDD][6 dígitos] => INV20260908000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.inventory_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCIÓN ATOMICA (siguiente número de inventario) ----------
create or replace function public.next_inventory_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.inventory_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.inventory_counters.last_number + 1
  returning 'INV' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_inventory_number() to anon, authenticated, service_role;

-- ---------- TABLA DE INVENTARIOS ----------
create table if not exists public.inventories (
  id               uuid primary key default gen_random_uuid(),
  inventory_number text not null,
  items            jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create unique index if not exists ux_inventories_number on public.inventories (inventory_number);
create index if not exists ix_inventories_created on public.inventories (created_at);

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.inventory_counters (day, last_number)
select current_date, coalesce(max((regexp_match(inventory_number, '^INV[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.inventories
where inventory_number ~ '^INV[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.inventories enable row level security;

-- Lectura para autenticados; escritura solo administradores. Sin borrado.
create policy "inventories_select" on public.inventories
  for select using (auth.uid() is not null);
create policy "inventories_insert" on public.inventories
  for insert with check (public.is_admin());
create policy "inventories_update" on public.inventories
  for update using (public.is_admin());
-- ============================================================
-- RUTEX - Número de pedido secuencial e irrepetible
-- Ejecutar en Supabase SQL Editor
-- Formato: PED[YYYYMMDD][6 dígitos secuenciales]  =>  PED20260907000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.order_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCIÓN ATOMICA (devuelve el siguiente número) ----------
create or replace function public.next_order_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.order_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.order_counters.last_number + 1
  returning 'PED' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_order_number() to anon, authenticated, service_role;

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.order_counters (day, last_number)
select current_date, coalesce(max((regexp_match(order_number, '^PED[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.orders
where order_number ~ '^PED[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- GARANTÍA EXTRA: deduplicar históricos y forzar unicidad ----------
with ranked as (
  select id,
         row_number() over (partition by order_number order by created_at) as rn
  from public.orders
  where order_number is not null
)
update public.orders o
set order_number = o.order_number || '-' || o.id::text
from ranked r
where o.id = r.id and r.rn > 1;

create unique index if not exists ux_orders_order_number on public.orders (order_number);
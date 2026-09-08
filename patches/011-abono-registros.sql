-- ============================================================
-- RUTEX - Histórico de abonos registrados por pedido
-- Un registro por cada vez que se ejecuta "Registrar abono".
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

create table if not exists public.abono_registros (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  monto      numeric(12,2) not null check (monto > 0),
  fecha      timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ix_abono_registros_order_id on public.abono_registros (order_id);
create index if not exists ix_abono_registros_order_fecha on public.abono_registros (order_id, fecha);

alter table public.abono_registros enable row level security;

create policy "abono_registros_select" on public.abono_registros
  for select using (auth.uid() is not null);

create policy "abono_registros_insert" on public.abono_registros
  for insert with check (public.is_admin());

-- BACKFILL: por cada abono ya abonado (pagado o parcial con fecha de pago)
-- crea su registro con el monto aplicado y la fecha de pago.
insert into public.abono_registros (order_id, monto, fecha)
select a.order_id, a.abonado, coalesce(a.fecha_pago, now())
from public.abonos a
where a.abonado > 0
  and not exists (
    select 1 from public.abono_registros r
    where r.order_id = a.order_id and r.monto = a.abonado
  );
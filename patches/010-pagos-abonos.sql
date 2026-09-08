-- ============================================================
-- RUTEX - Cartera: pagos y abonos por pedido
-- Ejecutar en Supabase SQL Editor (idempotente)
--   * pago_estados : estados de un pago (Pendiente/Pagado/En mora)
--   * pagos        : uno por pedido aprobado (PK = order_id)
--   * abonos       : fechas/montos a abonar por pedido + flag pagado
-- Al aprobar un pedido se inserta su fila en pagos y sus abonos.
-- ============================================================

-- ---------- ESTADOS DE PAGO ----------
create table if not exists public.pago_estados (
  id          int primary key,
  name        text not null unique,
  description text
);

insert into public.pago_estados (id, name, description) values
  (1, 'Pendiente', 'Pago al día, pendiente de completarse'),
  (2, 'Pagado', 'Pedido saldado por completo'),
  (3, 'En mora', 'Al menos un abono vencido sin pagar')
on conflict (id) do nothing;

-- ---------- PAGOS (uno por pedido aprobado) ----------
create table if not exists public.pagos (
  order_id       uuid primary key references public.orders(id) on delete cascade,
  estado_pago_id int not null default 1 references public.pago_estados(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- ABONOS (fechas y montos a abonar) ----------
create table if not exists public.abonos (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  fecha_a_abonar date not null,
  monto_a_abonar numeric(12,2) not null check (monto_a_abonar > 0),
  abonado        numeric(12,2) not null default 0 check (abonado >= 0),
  pagado         boolean not null default false,
  fecha_pago     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists ix_abonos_order_id on public.abonos (order_id);
create index if not exists ix_abonos_order_fecha on public.abonos (order_id, fecha_a_abonar);

-- ---------- TRIGGER updated_at (genérico) ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pagos_updated on public.pagos;
create trigger trg_pagos_updated
  before update on public.pagos
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_abonos_updated on public.abonos;
create trigger trg_abonos_updated
  before update on public.abonos
  for each row execute function public.touch_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.pago_estados enable row level security;
alter table public.pagos enable row level security;
alter table public.abonos enable row level security;

create policy "pago_estados_select" on public.pago_estados
  for select using (auth.uid() is not null);

create policy "pagos_select" on public.pagos
  for select using (auth.uid() is not null);
create policy "pagos_insert" on public.pagos
  for insert with check (public.is_admin());
create policy "pagos_update" on public.pagos
  for update using (public.is_admin());

create policy "abonos_select" on public.abonos
  for select using (auth.uid() is not null);
create policy "abonos_insert" on public.abonos
  for insert with check (public.is_admin());
create policy "abonos_update" on public.abonos
  for update using (public.is_admin());

-- ---------- BACKFILL: pedidos ya aprobados ----------
-- Crea la fila de pago (Pendiente) y un abono por el total para que
-- aparezcan en cartera y puedan recibir abonos.
insert into public.pagos (order_id, estado_pago_id)
select o.id, 1
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.pagos p where p.order_id = o.id);

insert into public.abonos (order_id, fecha_a_abonar, monto_a_abonar)
select o.id, current_date, o.total
from public.orders o
where o.status_id = 6
  and o.deleted_at is null
  and not exists (select 1 from public.abonos a where a.order_id = o.id);
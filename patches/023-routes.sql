-- ============================================================
-- RUTEX - Rutas de visita/entrega a clientes
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Modelo: una ruta agrupa clientes a visitar (visita o entregas).
-- La ruta nace 'en_proceso'; cada cliente dentro de la ruta arranca
-- 'pendiente' y pasa a 'completada'/'cancelada' con su observacion.
-- Número de ruta: RUT[YYYYMMDD][6 dígitos] => RUT20260910000001
-- ============================================================

-- ---------- CONTADOR DIARIO ----------
create table if not exists public.route_counters (
  day         date primary key,
  last_number int not null default 0 check (last_number between 0 and 999999)
);

-- ---------- FUNCION ATOMICA (siguiente número de ruta) ----------
create or replace function public.next_route_number()
returns text
language sql
security definer
set search_path = public
as $$
  insert into public.route_counters (day, last_number)
  values (current_date, 1)
  on conflict (day) do update
    set last_number = public.route_counters.last_number + 1
  returning 'RUT' || to_char(day, 'YYYYMMDD') || lpad(last_number::text, 6, '0');
$$;

grant execute on function public.next_route_number() to anon, authenticated, service_role;

-- ---------- TABLA DE RUTAS ----------
create table if not exists public.routes (
  id         uuid primary key default gen_random_uuid(),
  route_code text not null,
  type       text not null check (type in ('visita', 'entregas')),
  status     text not null default 'en_proceso' check (status in ('en_proceso', 'completada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists ux_routes_code on public.routes (route_code);
create index if not exists ix_routes_created on public.routes (created_at);

-- ---------- TABLA DE CLIENTES POR RUTA ----------
create table if not exists public.route_clients (
  id          uuid primary key default gen_random_uuid(),
  route_id    uuid not null references public.routes (id) on delete cascade,
  client_id   uuid not null references public.clients (id) on delete cascade,
  visit_order int not null default 0,
  status      text not null default 'pendiente' check (status in ('pendiente', 'completada', 'cancelada')),
  observation text,
  created_at  timestamptz not null default now(),
  unique (route_id, client_id)
);

create index if not exists ix_route_clients_route on public.route_clients (route_id);
create index if not exists ix_route_clients_client on public.route_clients (client_id);

-- ---------- SEMILLA: arrancar el contador de hoy donde quedó el último ----------
insert into public.route_counters (day, last_number)
select current_date, coalesce(max((regexp_match(route_code, '^RUT[0-9]{8}([0-9]{6})$'))[1]::int), 0)
from public.routes
where route_code ~ '^RUT[0-9]{8}[0-9]{6}$'
on conflict (day) do nothing;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.routes enable row level security;
alter table public.route_clients enable row level security;

-- Lectura para autenticados; escritura solo administradores.
create policy "routes_select" on public.routes
  for select using (auth.uid() is not null);
create policy "routes_insert" on public.routes
  for insert with check (public.is_admin());
create policy "routes_update" on public.routes
  for update using (public.is_admin());

create policy "route_clients_select" on public.route_clients
  for select using (auth.uid() is not null);
create policy "route_clients_insert" on public.route_clients
  for insert with check (public.is_admin());
create policy "route_clients_update" on public.route_clients
  for update using (public.is_admin());
create policy "route_clients_delete" on public.route_clients
  for delete using (public.is_admin());
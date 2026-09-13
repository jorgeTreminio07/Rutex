-- ============================================================
-- 033 - Índices de rendimiento
-- Acelera las consultas de los listados (ahora paginadas
-- server-side), los reportes y el dashboard. Todos los índices
-- son idempotentes (CREATE INDEX IF NOT EXISTS) y no afectan datos.
-- ============================================================

-- Búsqueda de productos por nombre (listado + reportes).
create index if not exists idx_products_name on public.products (name);

-- Clientes: búsqueda por teléfono (empieza por) y cédula.
create index if not exists idx_clients_phone on public.clients (phone);
create index if not exists idx_clients_cedula on public.clients (cedula);

-- Pedidos: filtros de estado + fecha (listado, reportes, dashboard).
create index if not exists idx_orders_status_id on public.orders (status_id);
create index if not exists idx_orders_created_at on public.orders (created_at);
create index if not exists idx_orders_status_created
  on public.orders (status_id, created_at);
create index if not exists idx_orders_customer_name on public.orders (customer_name);

-- Abonos: la cartera consulta cuotas por 'pagado' y 'fecha_a_abonar',
-- y el reporte de cartera filtra cuotas por fecha.
create index if not exists idx_abonos_pagado on public.abonos (pagado);
create index if not exists idx_abonos_fecha_abonar on public.abonos (fecha_a_abonar);
create index if not exists idx_abonos_order_id on public.abonos (order_id);

-- Entregas: la vista filtra por estado y ordena por fecha de ingreso.
create index if not exists idx_deliveries_status_id on public.deliveries (status_id);
create index if not exists idx_deliveries_entered_at on public.deliveries (entered_at);

-- Pagos: la cartera/dashboard consultan pedidos con pagos.
create index if not exists idx_pagos_order_id on public.pagos (order_id);

-- Gastos y compras: los listados filtran y ordenan por fecha.
create index if not exists idx_gastos_created_at on public.gastos (created_at);
create index if not exists idx_compras_created_at on public.compras (created_at);

-- Mermas: listado por fecha.
create index if not exists idx_mermas_created_at on public.mermas (created_at);

-- Inventarios: listado por fecha.
create index if not exists idx_inventories_created_at on public.inventories (created_at);

-- Rutas: listado por estado y fecha de creación.
create index if not exists idx_routes_status on public.routes (status);
create index if not exists idx_routes_created_at on public.routes (created_at);
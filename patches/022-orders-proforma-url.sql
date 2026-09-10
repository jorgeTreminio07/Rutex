-- 022-orders-proforma-url.sql
-- Guarda la URL de la proforma de cada pedido para no regenerarla/subirla
-- en cada mensaje (WhatsApp). La proforma se genera y guarda al crear el pedido
-- (server-side en POST /api/orders) y se reutiliza al enviar mensajes.
alter table public.orders
  add column if not exists proforma_url text;
-- 030-orders-customer-address.sql
-- Snapshot de la dirección del cliente al crear el pedido (se muestra en el
-- recibo térmico y en la proforma). El cliente de pedidos internos envía su
-- dirección registrada; los pedidos del carrito (nombre/teléfono libre) quedan null.
alter table public.orders
  add column if not exists customer_address text;
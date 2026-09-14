-- 035: Stock fraccionario.
-- Los productos se venden por cajas/paquetes y puede venderse media unidad
-- (ej. 0.5, 1.25). Se convierte `products.stock` de int a numeric(12,3) para
-- sostener cantidades fraccionarias sin que la BD redondee.
-- Idempotente: re-ejecutar es un no-op.

alter table public.products
  alter column stock type numeric(12,3);

alter table public.products
  alter column stock set default 0;

comment on column public.products.stock is
  'Stock disponible. Puede ser fraccionario (ej. 0.5 = media caja/paquete).';
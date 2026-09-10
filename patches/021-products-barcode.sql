-- ============================================================
-- RUTEX - Código de barras en productos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Campo opcional para el código de barras del producto.
-- Se guarda tal cual se escanea/escribe (se limpia en la API).
alter table public.products
  add column if not exists barcode text;

-- Índice para búsquedas por código de barras (no único: el mismo
-- código puede repetirse en variantes del mismo producto).
create index if not exists ix_products_barcode on public.products(barcode);
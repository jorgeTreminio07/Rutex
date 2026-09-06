-- ============================================================
-- RUTEX - Precio de compra en productos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agrega el precio de compra (lo que le costo al dueño)
alter table public.products
  add column if not exists purchase_price numeric(12,2) not null default 0;

-- ============================================================
-- STORAGE: carpeta para fotos de productos
-- ============================================================
-- El bucket ya es público (rutex-storage). Los archivos se guardan
-- en productos/<nombre-slug>-<hash>.<ext> vía la API /api/uploads.
-- No se requiere SQL adicional: el servicio crea la carpeta
-- automáticamente al subir el primer archivo.
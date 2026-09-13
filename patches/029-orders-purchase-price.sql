-- ============================================================
-- RUTEX - Snapshot del precio de compra en pedidos (reportes)
-- Ejecutar en Supabase SQL Editor (idempotente)
--
-- Los pedidos guardan sus items en jsonb sin el precio de compra.
-- Este patch rellena los pedidos existentes con el purchase_price
-- vigente de cada producto como respaldo (backfill); para los
-- pedidos NUEVOS el snapshot lo hace server-side POST /api/orders,
-- igual que mermas. Con esto el reporte de ganancia compara el
-- precio de compra real del momento con el precio de venta.
-- Idempotente: no toca items que ya tengan purchasePrice.
-- ============================================================

update public.orders o
set items = sub.items
from (
  select
    o2.id,
    coalesce(
      jsonb_agg(
        case
          when it.value ? 'purchasePrice' then it.value
          else it.value || jsonb_build_object(
            'purchasePrice',
            coalesce(
              (select p.purchase_price from public.products p where p.id = (it.value ->> 'productId')::uuid),
              0
            )
          )
        end
        order by ord
      ) filter (where it.value is not null),
      '[]'::jsonb
    ) as items
  from public.orders o2
  cross join lateral jsonb_array_elements(o2.items) with ordinality as it(value, ord)
  where o2.items is not null and jsonb_typeof(o2.items) = 'array'
  group by o2.id
) sub
where o.id = sub.id;
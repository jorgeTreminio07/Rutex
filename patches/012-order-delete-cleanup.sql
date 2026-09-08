-- ============================================================
-- RUTEX - Limpieza de cartera al borrar un pedido
-- El borrado de pedidos es suave (orders.deleted_at + status 4),
-- así que el ON DELETE CASCADE no se dispara. Este trigger limpia
-- todo lo relacionado (pagos, abonos, abono_registros) cuando el
-- pedido se marca como eliminado.
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

create or replace function public.cleanup_order_cartera()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    delete from public.abono_registros where order_id = old.id;
    delete from public.abonos where order_id = old.id;
    delete from public.pagos where order_id = old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_cleanup_cartera on public.orders;
create trigger trg_orders_cleanup_cartera
  before update of deleted_at on public.orders
  for each row execute function public.cleanup_order_cartera();

-- LIMPIEZA: pedidos que ya estaban marcados como eliminados antes de
-- instalar el trigger. Elimina los restos de cartera que hayan quedado.
delete from public.abono_registros r
using public.orders o
where r.order_id = o.id and o.deleted_at is not null;

delete from public.abonos a
using public.orders o
where a.order_id = o.id and o.deleted_at is not null;

delete from public.pagos p
using public.orders o
where p.order_id = o.id and o.deleted_at is not null;
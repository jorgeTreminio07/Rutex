-- ============================================================
-- RUTEX - CORRECCIÓN 1: is_admin()
-- El regexp [^a-z] eliminaba la letra mayúscula 'A' de "Admin"
-- dejando "dmin" != "admin". Se normaliza a minúsculas primero.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid()
      and lower(regexp_replace(lower(r.name), '[^a-z]', '', 'g')) = 'admin'
      and p.status_id = 1
      and r.status_id = 1
  );
$$;
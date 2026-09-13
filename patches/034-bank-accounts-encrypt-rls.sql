-- ============================================================
-- 034 - CUENTAS BANCARIAS: lectura restringida a administradores
-- ============================================================
-- Los números de cuenta se cifran en reposo server-side (AES-256-GCM,
-- clave en env var BANK_ACCOUNT_ENC_KEY, ver src/lib/encrypt.ts).
-- Este patch cierra el vector de lectura directa: antes CUALQUIER usuario
-- autenticado podía leer los números completos vía PostgREST
-- (policy bank_select = using (auth.uid() is not null)).
--
-- Ahora solo el admin puede leer la tabla directamente. El carrito público
-- y las proformas siguen funcionando porque se sirven por /api/catalog y
-- /api/orders con service role (no aplica RLS).
--
-- Idempotente (drop + create).
-- ============================================================

drop policy if exists "bank_select" on public.bank_accounts;
create policy "bank_select" on public.bank_accounts
  for select using (public.is_admin());

-- ============================================================
-- FIN 034
-- ============================================================
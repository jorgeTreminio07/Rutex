import type { NextResponse } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-response";
import {
  getAuthenticatedUser,
  getEmbeddedRoleName,
  getEmbeddedRolePermissions,
  isAdminRole,
  rolePermissionsFor,
} from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

type GuardResult = { ok: boolean; response?: NextResponse };

// Resuelve el rol embebido del perfil SOLO si hay una sesión autenticada
// válida. Usa getUser() (valida el token contra el servidor de Auth), nunca
// getSession() (lee las cookies sin verificar y dispara el warning de supabase
// al acceder a session.user).
// null  → 401: sin sesión, token inválido/vencido o fallo técnico al leer el perfil.
// { roles } → sesión autenticada; roles puede ser null (perfil sin rol asignado).
async function getAccessContext(): Promise<{ roles: unknown } | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_id, roles(name, permissions)")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) return null;

    return { roles: profile?.roles ?? null };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<GuardResult> {
  const ctx = await getAccessContext();
  if (!ctx) {
    return { ok: false, response: unauthorized() };
  }

  const roleName = getEmbeddedRoleName(ctx.roles);
  if (!isAdminRole(roleName)) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

export async function requirePermission(permission: string): Promise<GuardResult> {
  const ctx = await getAccessContext();
  if (!ctx) {
    return { ok: false, response: unauthorized() };
  }

  const roleName = getEmbeddedRoleName(ctx.roles);
  if (isAdminRole(roleName)) return { ok: true };

  const permissions = rolePermissionsFor(roleName, getEmbeddedRolePermissions(ctx.roles));
  if (!permissions.includes(permission)) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

export async function requireOneOf(allowed: string[]): Promise<GuardResult> {
  const ctx = await getAccessContext();
  if (!ctx) {
    return { ok: false, response: unauthorized() };
  }

  const roleName = getEmbeddedRoleName(ctx.roles);
  if (isAdminRole(roleName)) return { ok: true };

  const permissions = rolePermissionsFor(roleName, getEmbeddedRolePermissions(ctx.roles));
  if (!allowed.some((p) => permissions.includes(p))) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}
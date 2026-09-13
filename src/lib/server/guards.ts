import type { NextResponse } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-response";
import {
  getEmbeddedRoleName,
  getEmbeddedRolePermissions,
  getSession,
  isAdminRole,
  rolePermissionsFor,
} from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

type GuardResult = { ok: boolean; response?: NextResponse };

async function getRoleInfo(sessionUserId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name, permissions)")
    .eq("id", sessionUserId)
    .maybeSingle();
  return profile?.roles;
}

export async function requireAdmin(): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }

  const roleName = getEmbeddedRoleName(await getRoleInfo(session.user.id));
  if (!isAdminRole(roleName)) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

export async function requirePermission(permission: string): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }

  const roles = await getRoleInfo(session.user.id);
  const roleName = getEmbeddedRoleName(roles);
  if (isAdminRole(roleName)) return { ok: true };

  const permissions = rolePermissionsFor(roleName, getEmbeddedRolePermissions(roles));
  if (!permissions.includes(permission)) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

export async function requireOneOf(allowed: string[]): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }

  const roles = await getRoleInfo(session.user.id);
  const roleName = getEmbeddedRoleName(roles);
  if (isAdminRole(roleName)) return { ok: true };

  const permissions = rolePermissionsFor(roleName, getEmbeddedRolePermissions(roles));
  if (!allowed.some((p) => permissions.includes(p))) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}
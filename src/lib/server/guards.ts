import type { NextResponse } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-response";
import { getEmbeddedRoleName, getSession, isAdminRole } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<{ ok: boolean; response?: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, roles(name)")
    .eq("id", session.user.id)
    .maybeSingle();

  const roleName = getEmbeddedRoleName(profile?.roles);
  if (!isAdminRole(roleName)) {
    return { ok: false, response: forbidden() };
  }

  return { ok: true };
}

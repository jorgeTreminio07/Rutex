import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  roleId: string | null;
  roleName: string | null;
  statusId: number;
}

export function getEmbeddedRoleName(raw: unknown): string | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const first = arr[0] as { name?: string } | undefined;
  return first?.name ?? null;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, email, image_url, role_id, status_id, roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    username: profile?.username ?? user.email?.split("@")[0] ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    email: profile?.email ?? user.email ?? null,
    imageUrl: profile?.image_url ?? null,
    roleId: profile?.role_id ?? null,
    roleName: getEmbeddedRoleName(profile?.roles),
    statusId: profile?.status_id ?? 1,
  };
}

export function isAdminRole(roleName: string | null): boolean {
  if (!roleName) return false;
  return roleName.toLowerCase().replace(/[^a-z]/g, "") === "admin";
}

export async function requireUser(): Promise<CurrentProfile> {
  const user = await getCurrentUser();
  if (!user) throw new ApiAuthError();
  return user;
}

export class ApiAuthError extends Error {
  constructor() {
    super("No autorizado");
    this.name = "ApiAuthError";
  }
}

import { createClient } from "@/lib/supabase/server";
import { ALL_PERMISSION_KEYS, normalizePermissions } from "@/lib/permissions";

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
  permissions: string[];
}

export function getEmbeddedRoleName(raw: unknown): string | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const first = arr[0] as { name?: string } | undefined;
  return first?.name ?? null;
}

export function getEmbeddedRolePermissions(raw: unknown): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const first = arr[0] as { permissions?: unknown } | undefined;
  return normalizePermissions(first?.permissions);
}

export function rolePermissionsFor(roleName: string | null, permissions: string[]): string[] {
  if (isAdminRole(roleName)) return [...ALL_PERMISSION_KEYS];
  return permissions;
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentUser(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, email, image_url, role_id, status_id, roles(name, permissions)")
    .eq("id", user.id)
    .maybeSingle();

  // Un error técnico en la lectura del perfil (red, token inválido, RLS) NO debe
  // convertirse en un usuario "fantasma" con permisos vacíos: eso deja a alguien
  // logueado pero sin menú y con el panel caído. Se propaga como error para que
  // el cliente reintente y conserve el estado, en vez de desloguear.
  if (profileError) {
    throw profileError;
  }

  // Perfil eliminado: sin acceso.
  if (profile && profile.status_id === 4) return null;

  // Perfil resuelto con rol de permisos reales (pueden ser vacíos): se conserva
  // al usuario logueado con su alcance, nunca se desloguea por no tener permisos.
  const roleName = getEmbeddedRoleName(profile?.roles);
  const permissions = rolePermissionsFor(
    roleName,
    getEmbeddedRolePermissions(profile?.roles),
  );

  return {
    id: user.id,
    username: profile?.username ?? user.email?.split("@")[0] ?? null,
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    email: profile?.email ?? user.email ?? null,
    imageUrl: profile?.image_url ?? null,
    roleId: profile?.role_id ?? null,
    roleName,
    statusId: profile?.status_id ?? 1,
    permissions,
  };
}

export function isAdminRole(roleName: string | null): boolean {
  return normalizeRoleName(roleName) === "admin";
}

export function normalizeRoleName(roleName: string | null): string {
  return (roleName ?? "").toLowerCase().replace(/[^a-z]/g, "");
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

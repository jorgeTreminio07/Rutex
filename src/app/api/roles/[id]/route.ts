import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response";
import { normalizePermissions } from "@/lib/permissions";
import { isAdminRole, normalizeRoleName } from "@/lib/server/auth";
import type { RoleRow } from "@/lib/server/role-helpers";
import { requirePermission } from "@/lib/server/guards";
import { createAdminClient } from "@/lib/supabase/admin";

interface Context {
  params: Promise<{ id: string }>;
}

const ROLE_SELECT = "id, name, description, status_id, permissions";

export async function PUT(request: Request, { params }: Context) {
  const guard = await requirePermission("roles:editar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;

  let body: { name?: string; description?: string; statusId?: number; permissions?: string[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("Cuerpo inválido");
  }

  const name = body.name?.trim();
  if (!name) return badRequest("El nombre es obligatorio");

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Rol no encontrado");
  if (isAdminRole(normalizeRoleName(existing.name))) {
    return forbidden("El rol de administrador no se puede editar");
  }
  if (isAdminRole(normalizeRoleName(name))) {
    return forbidden("No se puede convertir un rol en administrador");
  }

  const otherWithSameName = await supabase
    .from("roles")
    .select("id")
    .ilike("name", name)
    .is("deleted_at", null)
    .neq("id", id)
    .maybeSingle();
  if (otherWithSameName.data) return badRequest("Ya existe un rol con ese nombre");

  const { data, error } = await supabase
    .from("roles")
    .update({
      name,
      description: body.description?.trim() || null,
      status_id: body.statusId ?? 1,
      permissions: normalizePermissions(body.permissions),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select(ROLE_SELECT)
    .single();

  if (error) {
    if (error.code === "42501") return forbidden();
    return serverError(error);
  }

  const role = data as unknown as RoleRow;
  return ok({
    id: role.id,
    name: role.name,
    description: role.description,
    statusId: role.status_id,
    permissions: normalizePermissions(role.permissions),
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requirePermission("roles:eliminar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Rol no encontrado");
  if (isAdminRole(normalizeRoleName(existing.name))) {
    return forbidden("El rol de administrador no se puede eliminar");
  }

  const { error } = await supabase
    .from("roles")
    .update({
      deleted_at: new Date().toISOString(),
      status_id: 4,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return serverError(error);

  return noContent();
}
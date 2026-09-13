import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response";
import { normalizePermissions } from "@/lib/permissions";
import { isAdminRole, normalizeRoleName } from "@/lib/server/auth";
import type { RoleRow } from "@/lib/server/role-helpers";
import { requirePermission } from "@/lib/server/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_SELECT = "id, name, description, status_id, permissions";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return serverError(error);

  return ok(
    (data as unknown as RoleRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      statusId: r.status_id,
      permissions: normalizePermissions(r.permissions),
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requirePermission("roles:crear");
  if (!guard.ok) return guard.response!;

  let body: { name?: string; description?: string; statusId?: number; permissions?: string[] };
  try {
    body = await request.json();
  } catch {
    return badRequest("Cuerpo inválido");
  }

  const name = body.name?.trim();
  if (!name) return badRequest("El nombre es obligatorio");
  if (isAdminRole(normalizeRoleName(name))) {
    return forbidden("No se puede crear otro rol de administrador");
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("roles")
    .select("id")
    .ilike("name", name)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) return badRequest("Ya existe un rol con ese nombre");

  const { data, error } = await supabase
    .from("roles")
    .insert({
      name,
      description: body.description?.trim() || null,
      status_id: body.statusId ?? 1,
      permissions: normalizePermissions(body.permissions),
    })
    .select(ROLE_SELECT)
    .single();

  if (error) return serverError(error);

  const role = data as unknown as RoleRow;
  return created({
    id: role.id,
    name: role.name,
    description: role.description,
    statusId: role.status_id,
    permissions: normalizePermissions(role.permissions),
  });
}
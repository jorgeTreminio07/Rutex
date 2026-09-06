import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/server/guards";
import { createClient } from "@/lib/supabase/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Context) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response!;

  const { id } = await params;

  let body: { name?: string; description?: string; statusId?: number };
  try {
    body = await request.json();
  } catch {
    return badRequest("Cuerpo inválido");
  }

  const name = body.name?.trim();
  if (!name) return badRequest("El nombre es obligatorio");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Rol no encontrado");

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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, name, description, status_id")
    .single();

  if (error) {
    if (error.code === "42501") return forbidden();
    return serverError(error);
  }

  return ok({
    id: data.id,
    name: data.name,
    description: data.description,
    statusId: data.status_id,
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("roles")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Rol no encontrado");

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
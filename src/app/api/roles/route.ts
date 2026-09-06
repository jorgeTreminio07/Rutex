import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/server/guards";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, name, description, status_id, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return serverError(error);

  return ok(
    data.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      statusId: r.status_id,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response!;

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
    })
    .select("id, name, description, status_id")
    .single();

  if (error) {
    if (error.code === "42501") return forbidden();
    return serverError(error);
  }

  return created({
    id: data.id,
    name: data.name,
    description: data.description,
    statusId: data.status_id,
  });
}
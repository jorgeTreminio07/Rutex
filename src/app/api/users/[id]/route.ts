import {
  badRequest,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/server/guards";
import { removeFromStorage, uploadToStorage } from "@/lib/server/storage";
import { createAdminClient } from "@/lib/supabase/admin";

interface EmbeddedRole {
  id?: string | null;
  name?: string | null;
  description?: string | null;
}

function mapEmbeddedRole(raw: unknown): { id: string; name: string; description: string | null } | null {
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const first = arr[0] as EmbeddedRole | undefined;
  if (!first || !first.id || !first.name) return null;
  return {
    id: first.id,
    name: first.name,
    description: first.description ?? null,
  };
}

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Context) {
  const guard = await requirePermission("usuarios:editar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const formData = await request.formData();

  const username = String(formData.get("username") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const statusIdRaw = String(formData.get("statusId") ?? "").trim();
  const photoFile = formData.get("photo");
  const signatureFile = formData.get("signature");
  const removeSignature = String(formData.get("removeSignature") ?? "") === "true";

  if (!username) return badRequest("El usuario es obligatorio");
  if (!email) return badRequest("El correo es obligatorio");
  if (!roleId) return badRequest("Selecciona un rol");

  const admin = createAdminClient();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, image_url, signature_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Usuario no encontrado");

  if (password) {
    try {
      await admin.auth.admin.updateUserById(id, { password });
    } catch {
      return badRequest("No se pudo actualizar la contraseña");
    }
  }

  let imageUrl: string | null = existing.image_url;
  if (photoFile instanceof File) {
    const uploaded = await uploadToStorage(photoFile, "users", "photo", id);
    if (!uploaded) return badRequest("No se pudo subir la foto");
    await removeFromStorage(existing.image_url);
    imageUrl = uploaded;
  }

  let signatureUrl: string | null = existing.signature_url;
  if (signatureFile instanceof File) {
    const uploaded = await uploadToStorage(signatureFile, "users", "signature", id);
    if (!uploaded) return badRequest("No se pudo subir la firma");
    await removeFromStorage(existing.signature_url);
    signatureUrl = uploaded;
  } else if (removeSignature) {
    await removeFromStorage(existing.signature_url);
    signatureUrl = null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username,
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      image_url: imageUrl,
      signature_url: signatureUrl,
      role_id: roleId,
      status_id: statusIdRaw ? Number(statusIdRaw) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, username, first_name, last_name, email, image_url, signature_url, roles(id, name), status_id")
    .single();

  if (error) return serverError(error);

  return ok({
    id: data.id,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    imageUrl: data.image_url,
    signatureUrl: data.signature_url,
    role: mapEmbeddedRole(data.roles),
    statusId: data.status_id,
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requirePermission("usuarios:eliminar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, image_url, signature_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Usuario no encontrado");

  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: "876000h",
  });
  if (authError) return serverError(authError);

  await removeFromStorage(existing.image_url);
  await removeFromStorage(existing.signature_url);

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString(), status_id: 4 })
    .eq("id", id);

  if (error) return serverError(error);

  return noContent();
}
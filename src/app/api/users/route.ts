import {
  badRequest,
  created,
  ok,
  serverError,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/server/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/server/storage";

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

export async function GET() {
  const guard = await requirePermission("usuarios:ver");
  if (!guard.ok) return guard.response!;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, email, image_url, signature_url, roles(id, name), status_id")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) return serverError(error);

  return ok(
    data.map((p) => ({
      id: p.id,
      username: p.username,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
      imageUrl: p.image_url,
      signatureUrl: p.signature_url,
      role: mapEmbeddedRole(p.roles),
      statusId: p.status_id,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requirePermission("usuarios:crear");
  if (!guard.ok) return guard.response!;

  const formData = await request.formData();

  const username = String(formData.get("username") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const statusId = Number(formData.get("statusId") ?? 1);
  const photoFile = formData.get("photo");
  const signatureFile = formData.get("signature");

  if (!username) return badRequest("El usuario es obligatorio");
  if (!email) return badRequest("El correo es obligatorio");
  if (!password) return badRequest("La contraseña es obligatoria");
  if (!roleId) return badRequest("Selecciona un rol");

  const admin = createAdminClient();

  const existingEmail = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  const alreadyExists = existingEmail.data.users.some((u) => u.email?.toLowerCase() === email);
  if (alreadyExists) return badRequest("Ya existe un usuario con ese correo");

  const { data: createdAuth, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) return serverError(createError);
  if (!createdAuth.user) return serverError(new Error("No se pudo crear el usuario"));

  const newUserId = createdAuth.user.id;

  const imageUrl = photoFile instanceof File ? await uploadToStorage(photoFile, "users", "photo", newUserId) : null;
  const signatureUrl = signatureFile instanceof File ? await uploadToStorage(signatureFile, "users", "signature", newUserId) : null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: newUserId,
      username,
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      image_url: imageUrl,
      signature_url: signatureUrl,
      role_id: roleId,
      status_id: statusId,
    }, { onConflict: "id" })
    .select("id, username, first_name, last_name, email, image_url, signature_url, roles(id, name), status_id")
    .single();

  if (error) {
    await admin.auth.admin.deleteUser(newUserId);
    return serverError(error);
  }

  return created({
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
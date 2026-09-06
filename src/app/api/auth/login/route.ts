import { createClient } from "@/lib/supabase/server";
import { badRequest, ok, unauthorized } from "@/lib/api-response";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Cuerpo inválido");
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return badRequest("El email y la contraseña son obligatorios");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return unauthorized("Credenciales incorrectas");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, email, image_url")
    .eq("id", data.user.id)
    .maybeSingle();

  return ok({
    id: data.user.id,
    username: profile?.username ?? data.user.email?.split("@")[0] ?? "",
    firstName: profile?.first_name ?? null,
    lastName: profile?.last_name ?? null,
    email: profile?.email ?? data.user.email ?? null,
    imageUrl: profile?.image_url ?? null,
  });
}

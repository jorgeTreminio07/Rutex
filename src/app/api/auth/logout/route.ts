import { createClient } from "@/lib/supabase/server";
import { noContent, serverError } from "@/lib/api-response";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return serverError(error);
  return noContent();
}

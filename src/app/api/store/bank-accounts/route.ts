import {
  badRequest,
  conflict,
  created,
  serverError,
} from "@/lib/api-response";
import { requirePermission } from "@/lib/server/guards";
import { uploadToStorage } from "@/lib/server/storage";
import { createAdminClient } from "@/lib/supabase/admin";

const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: Request) {
  const guard = await requirePermission("configuracion:editar");
  if (!guard.ok) return guard.response!;

  const formData = await request.formData();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountHolder = String(formData.get("accountHolder") ?? "").trim();
  const qrFile = formData.get("qrCode");

  if (!bankName) return badRequest("El banco es obligatorio");
  if (!accountNumber) return badRequest("El número de cuenta es obligatorio");
  if (!accountHolder) return badRequest("El titular es obligatorio");

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("store_profile")
    .select("id")
    .eq("id", STORE_ROW_ID)
    .maybeSingle();

  if (!profile) return conflict("Aún no hay un perfil de tienda creado.");

  let qrUrl: string | null = null;
  if (qrFile instanceof File) {
    const uploaded = await uploadToStorage(qrFile, "store", "qr", crypto.randomUUID());
    if (!uploaded) return badRequest("No se pudo subir el QR");
    qrUrl = uploaded;
  }

  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({
      store_profile_id: STORE_ROW_ID,
      bank_name: bankName,
      currency,
      account_number: accountNumber,
      account_holder: accountHolder,
      qr_url: qrUrl,
    })
    .select("id, bank_name, account_number, account_holder, qr_url")
    .single();

  if (error) return serverError(error);

  return created({
    id: data.id,
    bankName: data.bank_name,
    currency,
    accountHolder: data.account_holder ?? "",
    lastFourDigits: data.account_number.slice(-4),
    qrUrl: data.qr_url,
  });
}
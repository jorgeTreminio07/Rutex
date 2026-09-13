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

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Context) {
  const guard = await requirePermission("configuracion:editar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const formData = await request.formData();

  const bankName = String(formData.get("bankName") ?? "").trim();
  const currency = String(formData.get("currency") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const accountHolder = String(formData.get("accountHolder") ?? "").trim();
  const qrFile = formData.get("qrCode");
  const removeQr = String(formData.get("removeQr") ?? "") === "true";

  if (!bankName) return badRequest("El banco es obligatorio");
  if (!accountHolder) return badRequest("El titular es obligatorio");

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("bank_accounts")
    .select("id, account_number, qr_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Cuenta bancaria no encontrada");

  let qrUrl = existing.qr_url;
  if (qrFile instanceof File) {
    const uploaded = await uploadToStorage(qrFile, "store", "qr", id);
    if (!uploaded) return badRequest("No se pudo subir el QR");
    await removeFromStorage(existing.qr_url);
    qrUrl = uploaded;
  } else if (removeQr) {
    await removeFromStorage(existing.qr_url);
    qrUrl = null;
  }

  const { data, error } = await supabase
    .from("bank_accounts")
    .update({
      bank_name: bankName,
      currency,
      account_number: accountNumber || existing.account_number,
      account_holder: accountHolder,
      qr_url: qrUrl,
    })
    .eq("id", id)
    .select("id, bank_name, account_number, account_holder, qr_url")
    .single();

  if (error) return serverError(error);

  return ok({
    id: data.id,
    bankName: data.bank_name,
    currency,
    accountHolder: data.account_holder ?? "",
    lastFourDigits: data.account_number.slice(-4),
    qrUrl: data.qr_url,
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requirePermission("configuracion:editar");
  if (!guard.ok) return guard.response!;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("bank_accounts")
    .select("id, qr_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return notFound("Cuenta bancaria no encontrada");

  await removeFromStorage(existing.qr_url);

  const { error } = await supabase
    .from("bank_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return serverError(error);

  return noContent();
}
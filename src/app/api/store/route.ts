import {
  badRequest,
  conflict,
  ok,
  serverError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/server/guards";
import { removeFromStorage, uploadToStorage } from "@/lib/server/storage";
import { createClient } from "@/lib/supabase/server";

const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001";

function mapBankAccount(b: {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string | null;
  currency: string | null;
  qr_url: string | null;
}) {
  return {
    id: b.id,
    bankName: b.bank_name,
    currency: b.currency ?? "C$",
    accountHolder: b.account_holder ?? "",
    accountNumber: b.account_number,
    lastFourDigits: b.account_number.slice(-4) || "••••",
    qrUrl: b.qr_url,
  };
}

export async function GET() {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("store_profile")
    .select("*")
    .eq("id", STORE_ROW_ID)
    .maybeSingle();

  if (error) return serverError(error);

  if (!profile) {
    return ok(null);
  }

  const { data: bankAccounts = [] } = (
    await supabase
      .from("bank_accounts")
      .select("id, bank_name, account_number, account_holder, currency, qr_url")
      .eq("store_profile_id", STORE_ROW_ID)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
  ) as unknown as {
    data: Array<{
      id: string;
      bank_name: string;
      account_number: string;
      account_holder: string | null;
      currency: string | null;
      qr_url: string | null;
    } | null>;
    error: null;
  };

  const mappedBankAccounts = (bankAccounts ?? [])
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map(mapBankAccount);

  return ok({
    id: profile.id,
    name: profile.name,
    ownerName: profile.owner_name,
    logoUrl: profile.logo_url,
    stampUrl: profile.stamp_url,
    signatureUrl: profile.signature_url,
    ruc: profile.ruc,
    email: profile.email,
    address: profile.address,
    phone: profile.phone,
    workingHours: profile.working_hours,
    bankAccounts: mappedBankAccounts,
  });
}

export async function PUT(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response!;

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return badRequest("El nombre es obligatorio");

  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const ruc = String(formData.get("ruc") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const workingHours = String(formData.get("workingHours") ?? "").trim();
  const logoFile = formData.get("logo");
  const stampFile = formData.get("stamp");
  const signatureFile = formData.get("signature");
  const removeLogo = String(formData.get("removeLogo") ?? "") === "true";
  const removeStamp = String(formData.get("removeStamp") ?? "") === "true";
  const removeSignature = String(formData.get("removeSignature") ?? "") === "true";

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("store_profile")
    .select("*")
    .eq("id", STORE_ROW_ID)
    .maybeSingle();

  if (!existing) return conflict("Aún no hay un perfil de tienda creado.");

  let logoUrl = existing.logo_url;
  if (logoFile instanceof File) {
    const uploaded = await uploadToStorage(logoFile, "store", "logo", STORE_ROW_ID);
    if (!uploaded) return badRequest("No se pudo subir el logo");
    await removeFromStorage(existing.logo_url);
    logoUrl = uploaded;
  } else if (removeLogo) {
    await removeFromStorage(existing.logo_url);
    logoUrl = null;
  }

  let stampUrl = existing.stamp_url;
  if (stampFile instanceof File) {
    const uploaded = await uploadToStorage(stampFile, "store", "stamp", STORE_ROW_ID);
    if (!uploaded) return badRequest("No se pudo subir el sello");
    await removeFromStorage(existing.stamp_url);
    stampUrl = uploaded;
  } else if (removeStamp) {
    await removeFromStorage(existing.stamp_url);
    stampUrl = null;
  }

  let signatureUrl = existing.signature_url;
  if (signatureFile instanceof File) {
    const uploaded = await uploadToStorage(signatureFile, "store", "signature", STORE_ROW_ID);
    if (!uploaded) return badRequest("No se pudo subir la firma");
    await removeFromStorage(existing.signature_url);
    signatureUrl = uploaded;
  } else if (removeSignature) {
    await removeFromStorage(existing.signature_url);
    signatureUrl = null;
  }

  const { data, error } = await supabase
    .from("store_profile")
    .update({
      name,
      owner_name: ownerName || null,
      ruc: ruc || null,
      email: email || null,
      address: address || null,
      phone: phone || null,
      working_hours: workingHours || null,
      logo_url: logoUrl,
      stamp_url: stampUrl,
      signature_url: signatureUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", STORE_ROW_ID)
    .select("*")
    .single();

  if (error) return serverError(error);

  const { data: bankAccounts = [] } = (
    await supabase
      .from("bank_accounts")
      .select("id, bank_name, account_number, account_holder, currency, qr_url")
      .eq("store_profile_id", STORE_ROW_ID)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
  ) as unknown as {
    data: Array<{
      id: string;
      bank_name: string;
      account_number: string;
      account_holder: string | null;
      currency: string | null;
      qr_url: string | null;
    } | null>;
    error: null;
  };

  const mappedBankAccounts = (bankAccounts ?? [])
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map(mapBankAccount);

  return ok({
    id: data.id,
    name: data.name,
    ownerName: data.owner_name,
    logoUrl: data.logo_url,
    stampUrl: data.stamp_url,
    signatureUrl: data.signature_url,
    ruc: data.ruc,
    email: data.email,
    address: data.address,
    phone: data.phone,
    workingHours: data.working_hours,
    bankAccounts: mappedBankAccounts,
  });
}
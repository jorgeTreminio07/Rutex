import { ok, serverError } from "@/lib/api-response"
import { createAdminClient } from "@/lib/supabase/admin"

const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001"

interface ProductRow {
  id: string
  name: string
  description: string | null
  price: number
  discount_percent: number
  category: string
  stock: number
  images: unknown
  created_at: string
}

interface StoreProfileRow {
  name: string | null
  logo_url: string | null
  phone: string | null
}

interface BankAccountRow {
  bank_name: string
  account_number: string
  account_holder: string | null
  currency: string | null
}

export async function GET() {
  const admin = createAdminClient()

  const { data: products, error: productsError } = (await admin
    .from("products")
    .select("id, name, description, price, discount_percent, category, stock, images, created_at")
    .is("deleted_at", null)) as unknown as {
    data: ProductRow[] | null
    error: { message: string } | null
  }

  if (productsError) return serverError(productsError)

  const { data: profile, error: profileError } = (await admin
    .from("store_profile")
    .select("name, logo_url, phone")
    .eq("id", STORE_ROW_ID)
    .maybeSingle()) as unknown as {
    data: StoreProfileRow | null
    error: { message: string } | null
  }

  if (profileError) return serverError(profileError)

  const { data: bankAccounts = [] } = (await admin
    .from("bank_accounts")
    .select("bank_name, account_number, account_holder, currency")
    .eq("store_profile_id", STORE_ROW_ID)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })) as unknown as {
    data: BankAccountRow[] | null
    error: { message: string } | null
  }

  return ok({
    products: (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      discountPercent: Number(p.discount_percent),
      category: p.category,
      stock: p.stock,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      createdAt: p.created_at,
    })),
    store: {
      name: profile?.name ?? "Rutex",
      logoUrl: profile?.logo_url ?? null,
      phone: profile?.phone ?? null,
    },
    bankAccounts: (bankAccounts ?? []).map((b) => ({
      bankName: b.bank_name,
      accountNumber: b.account_number,
      accountHolder: b.account_holder,
      currency: b.currency ?? "C$",
    })),
  })
}
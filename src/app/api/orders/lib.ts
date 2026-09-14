import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import type { BankAccountInfo } from "@/features/catalog/lib/whatsapp"
import { getAssetUrl, getBucketName, sanitizeStorageKeySegment } from "@/lib/assets"
import { decryptBankAccountNumber } from "@/lib/encrypt"
import { isValidQty, round2, roundQty } from "@/lib/format"
import { createAdminClient } from "@/lib/supabase/admin"
import type { OrderItem, PaymentType } from "@/types/interfaces/order.interface"

export const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001"

export interface ValidatedOrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

/**
 * Normaliza y valida los items de un pedido. La cantidad admite fracciones
 * (hasta 3 decimales: 0.5, 1.25…) y el precio de venta es el que envía el
 * cliente (precio oficial, con descuento o precio pactado) — solo se sanea.
 * Devuelve un error legible si algún item es inválido.
 */
export function validateOrderItems(
  rawItems: unknown,
): { ok: true; items: ValidatedOrderItem[] } | { ok: false; error: string } {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "El pedido debe tener al menos un producto" }
  }

  const items: ValidatedOrderItem[] = []
  for (const raw of rawItems as Array<Record<string, unknown>>) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "Hay un ítem de pedido inválido" }
    const productId = typeof raw.productId === "string" ? raw.productId.trim() : ""
    const productName = typeof raw.productName === "string" ? raw.productName.trim() : ""
    const quantity = Number(raw.quantity)
    const price = Number(raw.price)
    if (!productId || !productName) return { ok: false, error: "Hay un producto sin identificar en el pedido" }
    if (!isValidQty(quantity)) {
      return {
        ok: false,
        error: `Cantidad inválida para "${productName}": usa un número mayor a 0 con hasta 3 decimales`,
      }
    }
    if (!Number.isFinite(price) || price < 0) return { ok: false, error: `Precio inválido para "${productName}"` }
    items.push({ productId, productName, price: round2(price), quantity: roundQty(quantity) })
  }

  return { ok: true, items }
}

/** Total recalculado server-side: nunca se confía del cuerpo de la petición. */
export function computeOrderTotal(items: Array<{ price: number; quantity: number }>): number {
  return round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
}

/**
 * Snapshot del precio de compra vigente de cada producto (reporte de
 * ganancias). Se re-captura al crear y al editar para que el costo sea el del
 * momento en que el pedido quede listo para aprobar.
 */
export async function snapshotPurchasePrice(
  supabase: ReturnType<typeof createAdminClient>,
  items: ValidatedOrderItem[],
): Promise<OrderItem[]> {
  const ids = [...new Set(items.map((item) => item.productId).filter(Boolean))] as string[]
  const { data: snapshotProducts } = ids.length
    ? await supabase.from("products").select("id, purchase_price").in("id", ids)
    : { data: [] as Array<{ id: string; purchase_price: number | null }> }

  const purchasePriceById = new Map(
    (snapshotProducts ?? []).map((p) => [p.id, Number(p.purchase_price ?? 0) || 0]),
  )

  return items.map((item) => ({
    ...item,
    purchasePrice: purchasePriceById.get(item.productId) ?? 0,
  }))
}

/**
 * Genera y sube la proforma del pedido y guarda su URL en la BD.
 * Best-effort: cualquier fallo devuelve null sin bloquear el flujo.
 */
export async function generateAndStoreProforma(
  supabase: ReturnType<typeof createAdminClient>,
  order: {
    id: string
    order_number: string | null
    customer_name: string
    customer_phone: string | null
    items: OrderItem[]
    total: number
    payment_type: string | null
  },
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("store_profile")
      .select("name, phone, address")
      .eq("id", STORE_ROW_ID)
      .maybeSingle()

    const { data: bankRows = [] } = await supabase
      .from("bank_accounts")
      .select("bank_name, account_number, account_holder, currency")
      .eq("store_profile_id", STORE_ROW_ID)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    const bankAccounts: BankAccountInfo[] = (bankRows ?? []).map((a) => ({
      bankName: a.bank_name,
      accountNumber: decryptBankAccountNumber(a.account_number),
      accountHolder: a.account_holder,
      currency: a.currency ?? "C$",
    }))

    const pdf = generateProformaPdf({
      storeName: profile?.name ?? "Rutex",
      storeAddress: profile?.address ?? null,
      storePhone: profile?.phone ?? null,
      customerName: order.customer_name,
      customerPhone: order.customer_phone ?? "",
      orderNumber: order.order_number,
      items: order.items,
      total: order.total,
      paymentType: (order.payment_type as PaymentType) || "contado",
      bankAccounts,
    })

    const slug = sanitizeStorageKeySegment(order.customer_name, "cliente")
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8)}`
    const path = `proformas/proforma-${slug}-${stamp}.pdf`

    const bucket = getBucketName()
    const { data, error } = await supabase.storage.from(bucket).upload(
      path,
      pdf.output("arraybuffer") as ArrayBuffer,
      {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      },
    )

    if (error) return null

    const url = getAssetUrl(data?.path ?? path)
    await supabase.from("orders").update({ proforma_url: url }).eq("id", order.id)
    return url
  } catch {
    return null
  }
}

/**
 * Borra el archivo de una proforma vieja del Storage. Acepta el path relativo
 * o la URL pública (se extrae el path tras `/object/public/<bucket>/`).
 * Best-effort: si no se puede determinar el path o el borrado falla, no lanza.
 */
export async function removeStoredProforma(
  supabase: ReturnType<typeof createAdminClient>,
  url: string | null | undefined,
): Promise<void> {
  if (!url) return
  try {
    let path: string | null
    if (/^https?:\/\//.test(url)) {
      const marker = `/object/public/${getBucketName()}/`
      const idx = url.indexOf(marker)
      if (idx === -1) return
      path = url.slice(idx + marker.length)
    } else {
      path = url.startsWith("/") ? url.slice(1) : url
    }
    if (!path) return
    await supabase.storage.from(getBucketName()).remove([path])
  } catch {
    // best-effort: no bloquear la edición si la limpieza falla
  }
}
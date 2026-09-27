import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import { round2, toNumber } from "@/app/api/reports/helpers"
import { roundQty } from "@/lib/format"
import type { StockReportDto, StockReportRow } from "@/types/interfaces/report.interface"

// LEFT JOIN (sin !inner) a propósito: si la política de RLS de `statuses` llegara
// a filtrar, ningún producto debe desaparecer del reporte.
const STOCK_SELECT =
  "name, category, stock, purchase_price, price, discount_percent, status_id, statuses(name)"

// Umbral de "stock bajo" que ya usa el dashboard (productos con stock <= 5).
const STOCK_BJO = 5

const ESTADO_LABELS: Record<number, string> = {
  1: "Activo",
  2: "Inactivo",
  3: "Bloqueado",
  4: "Eliminado",
}

/**
 * Reporte de inventario: snapshot del stock actual de cada producto (no usa
 * rango de fechas, lee el estado vivo del catálogo). Incluye precio de compra,
 * precio de venta efectivo (con descuento) y el valor del inventario a costo
 * y a precio de venta, para saber cuánto dinero hay parado en bodega.
 */
export async function GET() {
  const guard = await requirePermission("reportes:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const result = await fetchAllRows<{
    name: string
    category: string
    stock: number | string | null
    purchase_price: number | string | null
    price: number | string | null
    discount_percent: number | string | null
    status_id: number
    statuses: unknown
  }>((from, to) =>
    supabase
      .from("products")
      .select(STOCK_SELECT)
      .is("deleted_at", null)
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to),
  )

  if (!result.data) return serverError(result.error)

  const rows: StockReportRow[] = result.data.map((product) => {
    // El stock es numeric(12,3): se redondea a 3 decimales, no a 2 como el dinero.
    const stock = roundQty(toNumber(product.stock))
    const precioCompra = round2(toNumber(product.purchase_price))
    const lista = toNumber(product.price)
    const descuento = toNumber(product.discount_percent)
    const precioVenta = round2(descuento > 0 ? lista * (1 - descuento / 100) : lista)
    const estado = product.statuses as { name?: string } | null

    return {
      producto: product.name,
      categoria: product.category,
      stock,
      precioCompra,
      precioVenta,
      valorCosto: round2(stock * precioCompra),
      valorVenta: round2(stock * precioVenta),
      estado: estado?.name ?? ESTADO_LABELS[product.status_id] ?? "—",
    }
  })

  const dto: StockReportDto = {
    generatedAt: new Date().toISOString(),
    rows,
    summary: {
      productos: rows.length,
      unidades: roundQty(rows.reduce((sum, row) => sum + row.stock, 0)),
      valorCosto: round2(rows.reduce((sum, row) => sum + row.valorCosto, 0)),
      valorVenta: round2(rows.reduce((sum, row) => sum + row.valorVenta, 0)),
      agotados: rows.filter((row) => row.stock <= 0).length,
      stockBajo: rows.filter((row) => row.stock > 0 && row.stock <= STOCK_BJO).length,
    },
  }

  return ok(dto)
}

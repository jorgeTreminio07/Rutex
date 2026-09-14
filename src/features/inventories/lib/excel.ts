"use client"

import { exportRowsToExcel, type ExcelColumn } from "@/features/reports/lib/excel"
import type { InventoryDto } from "@/types/interfaces/inventory.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"

const MONEY_FORMAT = "#,##0.00"

export async function exportInventoryToExcel(
  inventory: InventoryDto,
  products: ProductDto[],
): Promise<void> {
  const priceByProduct = new Map(products.map((product) => [product.id, product]))

  let totalUnits = 0
  let totalCost = 0
  let totalSale = 0
  let totalProfit = 0

  const rows = inventory.items.map((item) => {
    const product = priceByProduct.get(item.productId)
    const purchasePrice = product?.purchasePrice ?? 0
    const price = product?.price ?? 0
    const profit = (price - purchasePrice) * item.quantity

    totalUnits += item.quantity
    totalCost += purchasePrice * item.quantity
    totalSale += price * item.quantity
    totalProfit += profit

    return {
      producto: item.productName,
      cantidad: item.quantity,
      precioCompra: purchasePrice,
      precioVenta: price,
      ganancia: profit,
    }
  })

  const columns: ExcelColumn[] = [
    { header: "Producto", key: "producto", width: 42 },
    { header: "Cantidad", key: "cantidad", width: 10, numFmt: "0.###" },
    { header: "P. Compra", key: "precioCompra", width: 12, numFmt: MONEY_FORMAT },
    { header: "P. Venta", key: "precioVenta", width: 12, numFmt: MONEY_FORMAT },
    { header: "Ganancia", key: "ganancia", width: 13, numFmt: MONEY_FORMAT },
  ]

  await exportRowsToExcel({
    sheetName: `Inventario ${inventory.inventoryNumber}`,
    filename: `inventario-${inventory.inventoryNumber}.xlsx`,
    columns,
    rows,
    totalRow: {
      producto: "TOTAL",
      cantidad: totalUnits,
      precioCompra: totalCost,
      precioVenta: totalSale,
      ganancia: totalProfit,
    },
    totalLabel: "TOTAL",
  })
}
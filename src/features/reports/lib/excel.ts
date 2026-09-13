"use client"

import type { ProfitReportDto } from "@/types/interfaces/report.interface"

const MONEY_FORMAT = "#,##0.00"

/**
 * Descarga el reporte de ganancias como archivo .xlsx real.
 * Genera la hoja con las columnas Fecha / Pedido / Producto / Cantidad /
 * P. Compra / P. Venta / Ganancia + fila TOTAL. Se importa exceljs bajo
 * demanda para no inflar el bundle inicial.
 */
export async function exportProfitToExcel(dto: ProfitReportDto): Promise<void> {
  const ExcelJS = (await import("exceljs")).default

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Rutex"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Ganancias")

  sheet.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Pedido", key: "orderNumber", width: 18 },
    { header: "Producto", key: "productName", width: 42 },
    { header: "Cantidad", key: "cantidad", width: 10 },
    { header: "P. Compra", key: "precioCompra", width: 12 },
    { header: "P. Venta", key: "precioVenta", width: 12 },
    { header: "Ganancia", key: "ganancia", width: 13 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.height = 20

  for (const row of dto.rows) {
    const excelRow = sheet.addRow({
      fecha: row.fecha,
      orderNumber: row.orderNumber ?? "",
      productName: row.productName,
      cantidad: row.cantidad,
      precioCompra: row.precioCompra,
      precioVenta: row.precioVenta,
      ganancia: row.ganancia,
    })
    excelRow.getCell("cantidad").numFmt = "0"
    excelRow.getCell("precioCompra").numFmt = MONEY_FORMAT
    excelRow.getCell("precioVenta").numFmt = MONEY_FORMAT
    excelRow.getCell("ganancia").numFmt = MONEY_FORMAT
  }

  const totalRow = sheet.addRow({
    fecha: "",
    orderNumber: "",
    productName: "TOTAL",
    cantidad: dto.summary.unidades,
    precioCompra: dto.summary.costo,
    precioVenta: dto.summary.ventas,
    ganancia: dto.summary.ganancia,
  })
  totalRow.font = { bold: true }
  totalRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F4F4" } }
  })
  totalRow.getCell("cantidad").numFmt = "0"
  totalRow.getCell("precioCompra").numFmt = MONEY_FORMAT
  totalRow.getCell("precioVenta").numFmt = MONEY_FORMAT
  totalRow.getCell("ganancia").numFmt = MONEY_FORMAT

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF008484" } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    }
  })
  headerRow.commit()

  const lastRow = sheet.rowCount
  if (lastRow > 2) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: lastRow, column: 7 },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = downloadName(dto)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadName(dto: ProfitReportDto): string {
  const base = dto.from === dto.to ? `ganancias-${dto.from}` : `ganancias-${dto.from}-a-${dto.to}`
  return `${base}.xlsx`
}
"use client"

import type { ProfitReportDto } from "@/types/interfaces/report.interface"

const MONEY_FORMAT = "#,##0.00"

export interface ExcelColumn {
  header: string
  key: string
  width: number
  numFmt?: string
}

export interface ExportRowsToExcelOptions {
  sheetName: string
  filename: string
  columns: ExcelColumn[]
  rows: object[]
  totalRow?: object
  totalLabel?: string
}

/**
 * Descarga un reporte como archivo .xlsx real usando exceljs (import bajo
 * demanda). Escribe los encabezados, las filas, una fila TOTAL opcional,
 * autofiltro y formato de moneda/cantidad según las columnas.
 */
export async function exportRowsToExcel(options: ExportRowsToExcelOptions): Promise<void> {
  const ExcelJS = (await import("exceljs")).default

  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Rutex"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(options.sheetName)

  sheet.columns = options.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }))

  const headerRow = sheet.getRow(1)
  headerRow.height = 20

  for (const row of options.rows) {
    const excelRow = sheet.addRow(row)
    for (const col of options.columns) {
      if (col.numFmt) excelRow.getCell(col.key).numFmt = col.numFmt
    }
  }

  if (options.totalRow) {
    const totalRow = sheet.addRow(options.totalRow)
    totalRow.font = { bold: true }
    totalRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F4F4" } }
    })
    if (options.totalLabel) totalRow.getCell(1).value = options.totalLabel
    for (const col of options.columns) {
      if (col.numFmt) totalRow.getCell(col.key).numFmt = col.numFmt
    }
  }

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
      to: { row: lastRow, column: options.columns.length },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = options.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Exporta el reporte de ganancias (columnas Fecha / Pedido / Producto /
 * Cantidad / P. Compra / P. Venta / Ganancia + fila TOTAL).
 */
export async function exportProfitToExcel(dto: ProfitReportDto): Promise<void> {
  const columns: ExcelColumn[] = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Pedido", key: "orderNumber", width: 18 },
    { header: "Producto", key: "productName", width: 42 },
    { header: "Cantidad", key: "cantidad", width: 10, numFmt: "0" },
    { header: "P. Compra", key: "precioCompra", width: 12, numFmt: MONEY_FORMAT },
    { header: "P. Venta", key: "precioVenta", width: 12, numFmt: MONEY_FORMAT },
    { header: "Ganancia", key: "ganancia", width: 13, numFmt: MONEY_FORMAT },
  ]

  const filename =
    dto.from === dto.to ? `ganancias-${dto.from}.xlsx` : `ganancias-${dto.from}-a-${dto.to}.xlsx`

  await exportRowsToExcel({
    sheetName: "Ganancias",
    filename,
    columns,
    rows: dto.rows,
    totalRow: {
      fecha: "",
      orderNumber: "",
      productName: "TOTAL",
      cantidad: dto.summary.unidades,
      precioCompra: dto.summary.costo,
      precioVenta: dto.summary.ventas,
      ganancia: dto.summary.ganancia,
    },
    totalLabel: "TOTAL",
  })
}
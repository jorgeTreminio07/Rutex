export interface ProfitReportRow {
  fecha: string
  orderNumber: string | null
  productName: string
  cantidad: number
  precioCompra: number
  precioVenta: number
  ganancia: number
}

export interface ProfitReportSummary {
  pedidos: number
  unidades: number
  ventas: number
  costo: number
  ganancia: number
}

export interface ProfitReportDto {
  from: string
  to: string
  rows: ProfitReportRow[]
  summary: ProfitReportSummary
}
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

export interface ProductSalesReportRow {
  productId: string | null
  productName: string
  cantidad: number
  ventas: number
  costo: number
  ganancia: number
}

export interface ProductSalesReportSummary {
  productos: number
  unidades: number
  ventas: number
  costo: number
  ganancia: number
}

export interface ProductSalesReportDto {
  from: string
  to: string
  rows: ProductSalesReportRow[]
  summary: ProductSalesReportSummary
}

export interface ClientSalesReportRow {
  cliente: string
  pedidos: number
  unidades: number
  ventas: number
  ganancia: number
}

export interface ClientSalesReportSummary {
  clientes: number
  pedidos: number
  unidades: number
  ventas: number
  ganancia: number
}

export interface ClientSalesReportDto {
  from: string
  to: string
  rows: ClientSalesReportRow[]
  summary: ClientSalesReportSummary
}

export type CuotaEstado = "Pagado" | "Vencido" | "Pendiente"

export interface CarteraReportRow {
  orderNumber: string | null
  cliente: string
  cuota: number
  cuotas: number
  fechaAbonar: string
  monto: number
  abonado: number
  estado: CuotaEstado
  saldo: number
}

export interface CarteraReportSummary {
  cuotas: number
  monto: number
  cobrado: number
  pendiente: number
}

export interface CarteraReportDto {
  from: string
  to: string
  rows: CarteraReportRow[]
  summary: CarteraReportSummary
}

export interface HourSalesReportRow {
  hora: number
  pedidos: number
  ventas: number
}

export interface HourSalesReportSummary {
  pedidos: number
  ventas: number
  horarioPico: number | null
}

export interface HourSalesReportDto {
  from: string
  to: string
  rows: HourSalesReportRow[]
  summary: HourSalesReportSummary
}
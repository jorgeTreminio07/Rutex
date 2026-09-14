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

export interface DashboardKpis {
  ventasHoy: number
  gananciaHoy: number
  pedidosHoy: number
  pedidosEnProceso: number
  carteraPendiente: number
  cuotasVencidas: number
  stockBajos: number
}

export interface DashboardVentasDiaRow {
  fecha: string
  ventas: number
  ganancia: number
  pedidos: number
}

export interface DashboardTopProductoRow {
  producto: string
  unidades: number
  ventas: number
}

export interface DashboardCashflowRow {
  mes: string
  ventas: number
  compras: number
  gastos: number
}

export interface DashboardHorarioRow {
  hora: number
  pedidos: number
}

export interface DashboardEntregasRow {
  statusId: number
  status: string
  count: number
}

export interface DashboardStockBajoRow {
  producto: string
  stock: number
}

export interface DashboardMermaMotivoRow {
  motivo: string
  total: number
}

export interface GastoReportRow {
  fecha: string
  titulo: string
  observacion: string | null
  monto: number
}

export interface GastoReportSummary {
  gastos: number
  total: number
}

export interface GastoReportDto {
  from: string
  to: string
  rows: GastoReportRow[]
  summary: GastoReportSummary
}

export interface CompraReportRow {
  fecha: string
  titulo: string
  proveedor: string | null
  monto: number
}

export interface CompraReportSummary {
  compras: number
  total: number
  proveedores: number
}

export interface CompraReportDto {
  from: string
  to: string
  rows: CompraReportRow[]
  summary: CompraReportSummary
}

export interface MermaReportRow {
  fecha: string
  mermaNumber: string | null
  motivo: string
  unidades: number
  costo: number
  valorVenta: number
}

export interface MermaReportSummary {
  mermas: number
  unidades: number
  costo: number
  valorVenta: number
}

export interface MermaReportDto {
  from: string
  to: string
  rows: MermaReportRow[]
  summary: MermaReportSummary
}

export interface PerdidaReportRow {
  fecha: string
  mermaNumber: string | null
  motivo: string
  producto: string
  cantidad: number
  costoPerdido: number
  valorVentaPerdido: number
}

export interface PerdidaReportSummary {
  mermas: number
  unidades: number
  costoPerdido: number
  valorVentaPerdido: number
}

export interface PerdidaReportDto {
  from: string
  to: string
  rows: PerdidaReportRow[]
  summary: PerdidaReportSummary
}

export interface ResumenDiaRow {
  fecha: string
  ventas: number
  costo: number
  gananciaBruta: number
  gastos: number
  mermas: number
  compras: number
}

export interface ResumenReportSummary {
  pedidos: number
  ventas: number
  costo: number
  gananciaBruta: number
  gastos: number
  perdidaMermas: number
  compras: number
  gananciaNeta: number
  flujoCaja: number
}

export interface ResumenReportDto {
  from: string
  to: string
  days: ResumenDiaRow[]
  summary: ResumenReportSummary
}

export interface DashboardDto {
  generatedAt: string
  kpis: DashboardKpis
  ventasPorDia: DashboardVentasDiaRow[]
  topProductos: DashboardTopProductoRow[]
  cartera: { cobrado: number; pendiente: number }
  cashflow: DashboardCashflowRow[]
  horario: DashboardHorarioRow[]
  entregas: DashboardEntregasRow[]
  stockBajo: DashboardStockBajoRow[]
  mermasPorMotivo: DashboardMermaMotivoRow[]
}
"use client"

import { BoxesIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useStockReport } from "@/features/reports/hooks/use-reports"
import { exportRowsToExcel, QTY_FORMAT } from "@/features/reports/lib/excel"
import { nicaTodayStr } from "@/features/reports/lib/date-range"
import { fmtMoney } from "@/features/reports/lib/format"
import { formatQty } from "@/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { StockReportDto, StockReportRow } from "@/types/interfaces/report.interface"

const MONEY = "#,##0.00"
const PAGE_SIZE = 15
const MOBILE_PAGE_SIZE = 10
const STOCK_BJO = 5
const MAX_ALERTA = 8

/** Fecha y hora del corte en hora de Nicaragua (el ISO del server es UTC). */
function fmtCorte(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("es-NI", {
    timeZone: "America/Managua",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function nombres(limitados: StockReportRow[]): string {
  const nombres = limitados.slice(0, MAX_ALERTA).map((row) => row.producto)
  const resto = limitados.length - nombres.length
  return resto > 0 ? `${nombres.join(", ")} y ${resto} más` : nombres.join(", ")
}

export function StockReport() {
  const { data, isLoading, isFetching } = useStockReport()
  const [search, setSearch] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const rows = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    if (!term) return data.rows
    return data.rows.filter(
      (row) =>
        row.producto.toLowerCase().includes(term) || row.categoria.toLowerCase().includes(term),
    )
  }, [data, search])

  // Los totales del resumen siempre reflejan el catálogo completo, aunque se
  // esté buscando o exportando un subconjunto: así el Excel y las tarjetas no
  // se contradicen con el pie "N productos".
  const handleExport = async () => {
    if (!data || data.rows.length === 0) {
      toast.info("No hay datos para exportar")
      return
    }
    setIsExporting(true)
    try {
      await exportStock(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const corte = data ? fmtCorte(data.generatedAt) : ""
  const footer = data
    ? `${rows.length} de ${data.rows.length} producto(s) · unidades ${formatQty(summary?.unidades ?? 0)}`
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BoxesIcon className="size-4 text-primary" />
          Inventario actual
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Foto del stock de este momento{corte ? ` (${corte})` : ""}: existencias, valor a costo y
          valor a precio de venta de cada producto.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ReportToolbar
          from=""
          to=""
          onFromChange={() => {}}
          onToChange={() => {}}
          onPreset={() => {}}
          today=""
          monthStart=""
          onExport={handleExport}
          isExporting={isExporting}
          canExport={Boolean(data && data.rows.length > 0)}
          isFetching={isFetching}
          footer={footer}
          showDates={false}
        />

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar producto o categoría…"
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Productos" value={String(summary.productos)} />
            <SummaryCard label="Unidades" value={formatQty(summary.unidades)} />
            <SummaryCard label="Valor a costo" value={fmtMoney(summary.valorCosto)} />
            <SummaryCard label="Valor a venta" value={fmtMoney(summary.valorVenta)} highlight />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : rows.length > 0 ? (
          <>
            <AlertasStock rows={data?.rows ?? []} />
            <div className="hidden md:block">
              <StockTable rows={rows} summary={summary} />
            </div>
            <div className="md:hidden">
              <StockMobileList rows={rows} summary={summary} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {data && data.rows.length > 0
              ? "Ningún producto coincide con la búsqueda."
              : "No hay productos registrados."}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Aviso de agotados y stock bajo sobre el catálogo completo, no sobre la búsqueda. */
function AlertasStock({ rows }: { rows: StockReportRow[] }) {
  const agotados = rows.filter((row) => row.stock <= 0)
  const stockBajo = rows.filter((row) => row.stock > 0 && row.stock <= STOCK_BJO)
  if (agotados.length === 0 && stockBajo.length === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
      {agotados.length > 0 && (
        <p className="text-destructive">
          <span className="font-semibold">{agotados.length}</span> producto(s) agotados:{" "}
          {nombres(agotados)}
        </p>
      )}
      {stockBajo.length > 0 && (
        <p className="text-foreground">
          <span className="font-semibold">{stockBajo.length}</span> producto(s) con stock bajo (≤{" "}
          {STOCK_BJO}):{" "}
          <span className="text-muted-foreground">{nombres(stockBajo)}</span>
        </p>
      )}
    </div>
  )
}

function stockBadge(stock: number) {
  if (stock <= 0) return "destructive" as const
  if (stock <= STOCK_BJO) return "secondary" as const
  return "default" as const
}

function StockTable({
  rows,
  summary,
}: {
  rows: StockReportRow[]
  summary: StockReportDto["summary"] | undefined
}) {
  const { rows: pageRows, page, totalItems, pageSize, setPage } = usePaged(rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="w-36">Categoría</TableHead>
            <TableHead className="w-24 text-right">Stock</TableHead>
            <TableHead className="w-28 text-right">P. compra</TableHead>
            <TableHead className="w-28 text-right">P. venta</TableHead>
            <TableHead className="w-28 text-right">Valor costo</TableHead>
            <TableHead className="w-28 text-right">Valor venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={`${row.categoria}-${row.producto}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{row.producto}</span>
                  {row.estado !== "Activo" && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {row.estado}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{row.categoria}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={stockBadge(row.stock)}>{formatQty(row.stock)}</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {fmtMoney(row.precioCompra)}
              </TableCell>
              <TableCell className="text-right">{fmtMoney(row.precioVenta)}</TableCell>
              <TableCell className="text-right">{fmtMoney(row.valorCosto)}</TableCell>
              <TableCell className="text-right font-medium text-primary">
                {fmtMoney(row.valorVenta)}
              </TableCell>
            </TableRow>
          ))}
          {summary && (
            <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
              <TableCell colSpan={2}>TOTAL</TableCell>
              <TableCell className="text-right">{formatQty(summary.unidades)}</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="text-right">{fmtMoney(summary.valorCosto)}</TableCell>
              <TableCell className="text-right text-primary">{fmtMoney(summary.valorVenta)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function StockMobileList({
  rows,
  summary,
}: {
  rows: StockReportRow[]
  summary: StockReportDto["summary"] | undefined
}) {
  const { rows: pageRows, page, totalItems, pageSize, setPage } = usePaged(rows, MOBILE_PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      {summary && (
        <Card className="flex items-center justify-between bg-muted/40 p-3">
          <span className="text-sm font-semibold">VALOR A VENTA</span>
          <span className="text-sm font-bold text-primary">{fmtMoney(summary.valorVenta)}</span>
        </Card>
      )}
      <ul className="flex flex-col gap-2.5">
        {pageRows.map((row) => (
          <li key={`${row.categoria}-${row.producto}`} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{row.producto}</p>
                <Badge variant={stockBadge(row.stock)} className="shrink-0">
                  {formatQty(row.stock)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {row.categoria}
                </Badge>
                {row.estado !== "Activo" && (
                  <Badge variant="outline" className="text-[10px]">
                    {row.estado}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Costo <span className="font-medium text-foreground">{fmtMoney(row.valorCosto)}</span>
                </span>
                <span>
                  Venta{" "}
                  <span className="font-semibold text-primary">{fmtMoney(row.valorVenta)}</span>
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

async function exportStock(dto: StockReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Inventario",
    filename: `inventario-${nicaTodayStr()}.xlsx`,
    columns: [
      { header: "Producto", key: "producto", width: 42 },
      { header: "Categoría", key: "categoria", width: 20 },
      { header: "Stock", key: "stock", width: 12, numFmt: QTY_FORMAT },
      { header: "P. compra", key: "precioCompra", width: 13, numFmt: MONEY },
      { header: "P. venta", key: "precioVenta", width: 13, numFmt: MONEY },
      { header: "Valor costo", key: "valorCosto", width: 14, numFmt: MONEY },
      { header: "Valor venta", key: "valorVenta", width: 14, numFmt: MONEY },
      { header: "Estado", key: "estado", width: 12 },
    ],
    rows: dto.rows,
    totalRow: {
      producto: "TOTAL",
      categoria: "",
      stock: dto.summary.unidades,
      precioCompra: "",
      precioVenta: "",
      valorCosto: dto.summary.valorCosto,
      valorVenta: dto.summary.valorVenta,
      estado: "",
    },
    totalLabel: "TOTAL",
  })
}

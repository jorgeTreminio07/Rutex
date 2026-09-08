"use client"

import { EyeIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { CarteraPagoDto } from "@/types/interfaces/cartera.interface"

const PAGE_SIZE = 10

function statusVariant(estadoPagoId: number): "default" | "secondary" | "destructive" | "outline" {
  if (estadoPagoId === 2) return "default"
  if (estadoPagoId === 3) return "destructive"
  return "secondary"
}

function paymentTypeLabel(paymentType: string): string {
  if (paymentType === "cuotas_2") return "2 quincenas"
  if (paymentType === "cuotas_4") return "4 semanas"
  return "Contado"
}

function nicaDate(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

interface CarteraOrdersListProps {
  orders: CarteraPagoDto[]
  onView: (order: CarteraPagoDto) => void
}

export function CarteraOrdersList({ orders, onView }: CarteraOrdersListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(orders, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Pago total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-24">Estado</TableHead>
              <TableHead className="w-40 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => onView(order)}
              >
                <TableCell>
                  <span className="font-mono text-sm font-medium">{order.orderNumber || "—"}</span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.customerName}</p>
                  {order.customerPhone && (
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {paymentTypeLabel(order.paymentType)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  C$ {order.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {nicaDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(order.estadoPagoId)}>{order.estadoPago}</Badge>
                </TableCell>
                <TableCell>
                  <div
                    className="flex justify-end"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(order)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation()
                        onView(order)
                      }
                    }}
                  >
                    <Button variant="ghost" size="sm" className="gap-2">
                      <EyeIcon className="size-4" />
                      Ver detalles
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay pedidos en cartera.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          page={page}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((order) => (
          <div
            key={order.id}
            className="flex cursor-pointer flex-col gap-2 rounded-xl border p-4"
            role="button"
            tabIndex={0}
            onClick={() => onView(order)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onView(order)
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium">{order.orderNumber || "No."}</span>
              <Badge variant={statusVariant(order.estadoPagoId)}>{order.estadoPago}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {paymentTypeLabel(order.paymentType)}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">C$ {order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{nicaDate(order.createdAt)}</p>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay pedidos en cartera.</p>
        )}
        <DataTablePagination
          page={page}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
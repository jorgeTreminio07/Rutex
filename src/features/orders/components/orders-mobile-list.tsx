"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { OrderDto } from "@/types/interfaces/order.interface"

const PAGE_SIZE = 10

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Aprobado":
      return "default"
    case "En proceso":
      return "secondary"
    case "Rechazado":
      return "destructive"
    default:
      return "outline"
  }
}

interface OrdersMobileListProps {
  orders: OrderDto[]
  onApprove: (order: OrderDto) => void
  onReject: (order: OrderDto) => void
  onDelete: (order: OrderDto) => void
}

export function OrdersMobileList({ orders, onApprove, onReject, onDelete }: OrdersMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(orders, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((order) => (
          <li key={order.id}>
            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{order.orderNumber || "—"}</span>
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="mt-1 font-medium">{order.customerName}</p>
                  {order.customerPhone && (
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleDateString("es-NI")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">C$ {order.total.toFixed(2)}</p>
                </div>
              </div>
              {order.statusId === 5 && (
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => onApprove(order)}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5"
                    onClick={() => onReject(order)}
                  >
                    Rechazar
                  </Button>
                </div>
              )}
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(order)}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay pedidos registrados.
          </li>
        )}
      </ul>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}

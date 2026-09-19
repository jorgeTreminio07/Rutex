"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { fmtMoney } from "@/lib/format"
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
  onView: (order: OrderDto) => void
}

export function OrdersMobileList({ orders, onView }: OrdersMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(orders, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((order) => (
          <li key={order.id}>
            <Card className="cursor-pointer p-3 transition-colors hover:bg-muted/50" onClick={() => onView(order)}>
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
                  <p className="font-semibold">{fmtMoney(order.total)}</p>
                </div>
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
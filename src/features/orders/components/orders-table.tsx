"use client"

import { Trash2Icon } from "lucide-react"

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

interface OrdersTableProps {
  orders: OrderDto[]
  onApprove: (order: OrderDto) => void
  onReject: (order: OrderDto) => void
  onDelete: (order: OrderDto) => void
}

export function OrdersTable({ orders, onApprove, onReject, onDelete }: OrdersTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(orders, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-32 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <span className="font-mono text-sm font-medium">
                  {order.orderNumber || "—"}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  {order.customerPhone && (
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">
                C$ {order.total.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("es-NI")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {order.statusId === 5 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-600"
                        onClick={() => onApprove(order)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onReject(order)}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(order)}
                    aria-label={`Eliminar pedido ${order.orderNumber}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay pedidos registrados.
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
  )
}

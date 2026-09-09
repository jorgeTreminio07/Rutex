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
import { deliveryStatusVariant } from "@/types/interfaces/delivery.interface"
import { nicaDateTime } from "@/features/deliveries/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { DeliveryDto } from "@/types/interfaces/delivery.interface"

const PAGE_SIZE = 10

interface DeliveriesTableProps {
  deliveries: DeliveryDto[]
  onView: (delivery: DeliveryDto) => void
}

export function DeliveriesTable({ deliveries, onView }: DeliveriesTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(deliveries, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="w-32">Estado</TableHead>
            <TableHead>Ingresado</TableHead>
            <TableHead className="w-12 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((delivery) => (
            <TableRow key={delivery.id} className="cursor-pointer" onClick={() => onView(delivery)}>
              <TableCell>
                <span className="font-mono text-sm font-medium">{delivery.orderNumber}</span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{delivery.customerName}</p>
                  {delivery.customerPhone && (
                    <p className="text-xs text-muted-foreground">{delivery.customerPhone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {delivery.items.length} {delivery.items.length === 1 ? "producto" : "productos"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={deliveryStatusVariant(delivery.statusId)}>{delivery.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {nicaDateTime(delivery.enteredAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(delivery)
                    }}
                    aria-label={`Ver detalle de la entrega ${delivery.orderNumber}`}
                  >
                    <EyeIcon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay entregas registradas.
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
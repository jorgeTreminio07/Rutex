"use client"

import { EyeIcon, TruckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { deliveryStatusVariant } from "@/types/interfaces/delivery.interface"
import { nicaDateTime } from "@/features/deliveries/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { DeliveryDto } from "@/types/interfaces/delivery.interface"

const PAGE_SIZE = 10

interface DeliveriesMobileListProps {
  deliveries: DeliveryDto[]
  onView: (delivery: DeliveryDto) => void
}

export function DeliveriesMobileList({ deliveries, onView }: DeliveriesMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(deliveries, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((delivery) => (
          <li key={delivery.id}>
            <Card
              onClick={() => onView(delivery)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <TruckIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-sm font-medium">{delivery.orderNumber}</p>
                  <Badge variant={deliveryStatusVariant(delivery.statusId)}>{delivery.status}</Badge>
                </div>
                <p className="truncate text-sm font-medium">{delivery.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {delivery.items.length} {delivery.items.length === 1 ? "producto" : "productos"} ·{" "}
                  {nicaDateTime(delivery.enteredAt)}
                </p>
              </div>
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
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay entregas registradas.
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
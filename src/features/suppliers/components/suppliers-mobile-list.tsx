"use client"

import { FactoryIcon, MailIcon, MapPinIcon, PhoneIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

const PAGE_SIZE = 10

interface SuppliersMobileListProps {
  suppliers: SupplierDto[]
  onEdit: (supplier: SupplierDto) => void
  onDelete: (supplier: SupplierDto) => void
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  )
}

export function SuppliersMobileList({ suppliers, onEdit, onDelete }: SuppliersMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(suppliers, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((supplier) => (
          <li key={supplier.id} className="list-none">
            <Card
              onClick={() => onEdit(supplier)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {initials(supplier.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{supplier.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PhoneIcon className="size-3" />
                  {supplier.phone}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    RUC {supplier.ruc}
                  </Badge>
                  {supplier.ownerName && (
                    <Badge variant="outline" className="text-[10px]">
                      <FactoryIcon className="size-3" />
                      {supplier.ownerName}
                    </Badge>
                  )}
                  {supplier.email && (
                    <Badge variant="outline" className="text-[10px]">
                      <MailIcon className="size-3" />
                      {supplier.email}
                    </Badge>
                  )}
                  {supplier.address && (
                    <Badge variant="outline" className="text-[10px]">
                      <MapPinIcon className="size-3" />
                      {supplier.address}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(supplier)
                  }}
                  aria-label={`Editar proveedor ${supplier.name}`}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(supplier)
                  }}
                  aria-label={`Eliminar proveedor ${supplier.name}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay proveedores registrados.
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

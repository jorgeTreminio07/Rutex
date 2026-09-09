"use client"

import { MapPinIcon, PencilIcon, PhoneIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { ClientDto } from "@/types/interfaces/client.interface"

const PAGE_SIZE = 10

interface ClientsMobileListProps {
  clients: ClientDto[]
  onEdit: (client: ClientDto) => void
  onDelete: (client: ClientDto) => void
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

export function ClientsMobileList({ clients, onEdit, onDelete }: ClientsMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(clients, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((client) => (
          <li key={client.id}>
            <Card
              onClick={() => onEdit(client)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {initials(client.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{client.fullName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <PhoneIcon className="size-3" />
                  {client.phone}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  {client.cedula && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {client.cedula}
                    </Badge>
                  )}
                  {client.city && (
                    <Badge variant="outline" className="text-[10px]">
                      {client.city}
                    </Badge>
                  )}
                  {client.latitude != null && client.longitude != null && (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      <MapPinIcon className="size-3" />
                      {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
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
                    onEdit(client)
                  }}
                  aria-label={`Editar cliente ${client.fullName}`}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(client)
                  }}
                  aria-label={`Eliminar cliente ${client.fullName}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay clientes registrados.
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
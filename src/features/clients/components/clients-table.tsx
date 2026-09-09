"use client"

import { MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react"

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
import type { ClientDto } from "@/types/interfaces/client.interface"

const PAGE_SIZE = 10

interface ClientsTableProps {
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

export function ClientsTable({ clients, onEdit, onDelete }: ClientsTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(clients, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Cédula</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead className="w-40">Ubicación</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((client) => (
            <TableRow key={client.id} className="cursor-pointer" onClick={() => onEdit(client)}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(client.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{client.fullName}</p>
                    <p className="text-xs text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {client.cedula ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{client.city ?? "—"}</TableCell>
              <TableCell>
                {client.latitude != null && client.longitude != null ? (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    <MapPinIcon className="size-3" />
                    {client.latitude.toFixed(4)}, {client.longitude.toFixed(4)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
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
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay clientes registrados.
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
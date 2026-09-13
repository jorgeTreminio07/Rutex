"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CompraDeleteDialog } from "@/features/compras/components/compra-delete-dialog"
import {
  CompraFormDialog,
  type CompraSubmitValues,
  type ReceiptInfo,
} from "@/features/compras/components/compra-form-dialog"
import { ComprasMobileList } from "@/features/compras/components/compras-mobile-list"
import { ComprasTable } from "@/features/compras/components/compras-table"
import {
  useCreateCompra,
  useDeleteCompra,
  useCompras,
  useUpdateCompra,
} from "@/features/compras/hooks/use-compras"
import { uploadCompraReceiptRequest } from "@/features/compras/api/compras.api"
import { useSuppliers } from "@/features/suppliers/hooks/use-suppliers"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import type { CompraDto } from "@/types/interfaces/compra.interface"

export function ComprasView() {
  const { data: suppliers = [] } = useSuppliers()
  const createCompra = useCreateCompra()
  const updateCompra = useUpdateCompra()
  const deleteCompra = useDeleteCompra()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CompraDto | null>(null)
  const [deleting, setDeleting] = useState<CompraDto | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useCompras({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
  })

  const compras = data?.data ?? []
  const totalItems = data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(data?.page ?? 1, totalPages)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const openEdit = (compra: CompraDto) => {
    setEditing(compra)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const handleUploadReceipt = async (file: File, fallbackName: string): Promise<ReceiptInfo> => {
    setIsUploadingReceipt(true)
    try {
      return await uploadCompraReceiptRequest(file, fallbackName)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo subir el recibo"))
      throw error
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const handleSubmit = async (values: CompraSubmitValues) => {
    if (editing) {
      await updateCompra.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createCompra.mutateAsync(values)
    }
    setFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">
            Compras realizadas a proveedores con su monto y recibo.
          </p>
          {!isLoading && !isError && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {totalItems} {totalItems === 1 ? "compra" : "compras"}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nueva compra
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudieron cargar las compras."}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, proveedor o comentario…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1">
          <DatePicker value={dateFilter} onChange={handleDateChange} placeholder="Fecha" />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-2"
              onClick={() => handleDateChange("")}
              aria-label="Limpiar filtro de fecha"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <ComprasTable compras={compras} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <ComprasMobileList compras={compras} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <CompraFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        compra={editing}
        suppliers={suppliers}
        isPending={createCompra.isPending || updateCompra.isPending}
        isUploadingReceipt={isUploadingReceipt}
        onUploadReceipt={handleUploadReceipt}
        onSubmit={handleSubmit}
      />

      <CompraDeleteDialog
        compra={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteCompra.isPending}
        onConfirm={async () => {
          if (!deleting) return
          const id = deleting.id
          setDeleting(null)
          try {
            await deleteCompra.mutateAsync(id)
          } catch {
            // el toast de error ya lo muestra useDeleteCompra
          }
        }}
      />
    </div>
  )
}
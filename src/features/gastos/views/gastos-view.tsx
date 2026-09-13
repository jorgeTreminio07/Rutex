"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { GastoDeleteDialog } from "@/features/gastos/components/gasto-delete-dialog"
import {
  GastoFormDialog,
  type GastoSubmitValues,
  type ReceiptInfo,
} from "@/features/gastos/components/gasto-form-dialog"
import { GastosMobileList } from "@/features/gastos/components/gastos-mobile-list"
import { GastosTable } from "@/features/gastos/components/gastos-table"
import {
  useCreateGasto,
  useDeleteGasto,
  useGastos,
  useUpdateGasto,
} from "@/features/gastos/hooks/use-gastos"
import { uploadGastoReceiptRequest } from "@/features/gastos/api/gastos.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { toast } from "sonner"
import type { GastoDto } from "@/types/interfaces/gasto.interface"

export function GastosView() {
  const createGasto = useCreateGasto()
  const updateGasto = useUpdateGasto()
  const deleteGasto = useDeleteGasto()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GastoDto | null>(null)
  const [deleting, setDeleting] = useState<GastoDto | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useGastos({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
  })

  const gastos = data?.data ?? []
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

  const openEdit = (gasto: GastoDto) => {
    setEditing(gasto)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const handleUploadReceipt = async (file: File, fallbackName: string): Promise<ReceiptInfo> => {
    setIsUploadingReceipt(true)
    try {
      return await uploadGastoReceiptRequest(file, fallbackName)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo subir el recibo"))
      throw error
    } finally {
      setIsUploadingReceipt(false)
    }
  }

  const handleSubmit = async (values: GastoSubmitValues) => {
    if (editing) {
      await updateGasto.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createGasto.mutateAsync(values)
    }
    setFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Registro de gastos fijos de la tienda con su recibo.
          </p>
          {!isLoading && !isError && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {totalItems} {totalItems === 1 ? "gasto" : "gastos"}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nuevo gasto
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudieron cargar los gastos."}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o comentario…"
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
            <GastosTable gastos={gastos} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <GastosMobileList gastos={gastos} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <GastoFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        gasto={editing}
        isPending={createGasto.isPending || updateGasto.isPending}
        isUploadingReceipt={isUploadingReceipt}
        onUploadReceipt={handleUploadReceipt}
        onSubmit={handleSubmit}
      />

      <GastoDeleteDialog
        gasto={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteGasto.isPending}
        onConfirm={async () => {
          if (!deleting) return
          const id = deleting.id
          setDeleting(null)
          try {
            await deleteGasto.mutateAsync(id)
          } catch {
            // el toast de error ya lo muestra useDeleteGasto
          }
        }}
      />
    </div>
  )
}
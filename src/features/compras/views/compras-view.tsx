"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { nicaDate } from "@/features/deliveries/lib/format"
import { getApiErrorMessage } from "@/lib/api-client"
import type { CompraDto } from "@/types/interfaces/compra.interface"

export function ComprasView() {
  const { data: compras = [], isLoading } = useCompras()
  const { data: suppliers = [] } = useSuppliers()
  const createCompra = useCreateCompra()
  const updateCompra = useUpdateCompra()
  const deleteCompra = useDeleteCompra()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CompraDto | null>(null)
  const [deleting, setDeleting] = useState<CompraDto | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)

  const filtered = compras.filter((compra) => {
    if (dateFilter && nicaDate(compra.createdAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      const haystack = `${compra.title} ${compra.supplierName ?? ""} ${compra.observation ?? ""}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">
            Compras realizadas a proveedores con su monto y recibo.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nueva compra
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, proveedor o comentario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-1">
          <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Fecha" />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 px-2"
              onClick={() => setDateFilter("")}
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
            <ComprasTable compras={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <ComprasMobileList compras={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
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
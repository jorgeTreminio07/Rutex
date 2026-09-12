"use client"

import { PlusIcon, SearchIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { SupplierDeleteDialog } from "@/features/suppliers/components/supplier-delete-dialog"
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog"
import { SuppliersMobileList } from "@/features/suppliers/components/suppliers-mobile-list"
import { SuppliersTable } from "@/features/suppliers/components/suppliers-table"
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/features/suppliers/hooks/use-suppliers"
import type { SupplierFormValues } from "@/features/suppliers/validations/supplier.schema"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

export function SuppliersView() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierDto | null>(null)
  const [deleting, setDeleting] = useState<SupplierDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const filtered = suppliers.filter((supplier) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      supplier.name.toLowerCase().includes(q) ||
      supplier.ruc.toLowerCase().includes(q) ||
      (supplier.ownerName ?? "").toLowerCase().includes(q)
    )
  })

  const buildPayload = (values: SupplierFormValues) => ({
    name: values.name,
    ruc: values.ruc,
    phone: values.phone,
    address: values.address?.trim() || null,
    ownerName: values.ownerName?.trim() || null,
    email: values.email?.trim() || null,
  })

  const handleCreate = async (values: SupplierFormValues) => {
    await createSupplier.mutateAsync(buildPayload(values))
    setFormOpen(false)
  }

  const handleUpdate = async (values: SupplierFormValues) => {
    if (!editing) return
    await updateSupplier.mutateAsync({ id: editing.id, payload: buildPayload(values) })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const openEdit = (supplier: SupplierDto) => {
    setEditing(supplier)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Directorio de proveedores de la tienda.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Agregar proveedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, RUC o propietario…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
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
            <SuppliersTable suppliers={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <SuppliersMobileList suppliers={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        </>
      )}

      <SupplierFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editing}
        isPending={createSupplier.isPending || updateSupplier.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <SupplierDeleteDialog
        supplier={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteSupplier.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteSupplier.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

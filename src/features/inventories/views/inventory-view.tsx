"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoriesMobileList } from "@/features/inventories/components/inventories-mobile-list"
import { InventoriesTable } from "@/features/inventories/components/inventories-table"
import { InventoryFormDialog } from "@/features/inventories/components/inventory-form-dialog"
import {
  useCreateInventory,
  useInventories,
  useUpdateInventory,
} from "@/features/inventories/hooks/use-inventories"
import { useProducts } from "@/features/products/hooks/use-products"
import type { InventoryDto } from "@/types/interfaces/inventory.interface"

function nicaDate(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

export function InventoryView() {
  const { data: inventories = [], isLoading } = useInventories()
  const { data: products = [] } = useProducts()
  const createInventory = useCreateInventory()
  const updateInventory = useUpdateInventory()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const filtered = inventories.filter((inventory) => {
    if (dateFilter && nicaDate(inventory.createdAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      if (!`${inventory.inventoryNumber}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const openEdit = (inventory: InventoryDto) => {
    setEditing(inventory)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const initialQuantities = Object.fromEntries(
    (editing?.items ?? []).map((item) => [item.productId, item.quantity]),
  )

  const handleSubmit = async (items: InventoryDto["items"]) => {
    if (editing) {
      await updateInventory.mutateAsync({ id: editing.id, payload: { items } })
    } else {
      await createInventory.mutateAsync({ items })
    }
    setFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inventarios</h1>
          <p className="text-sm text-muted-foreground">
            Entradas de stock por producto. Al guardar se actualiza el stock.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Crear inventario
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de inventario…"
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
            <InventoriesTable inventories={filtered} onEdit={openEdit} />
          </div>
          <div className="md:hidden">
            <InventoriesMobileList inventories={filtered} onEdit={openEdit} />
          </div>
        </>
      )}

      <InventoryFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        products={products}
        initialQuantities={initialQuantities}
        isPending={createInventory.isPending || updateInventory.isPending}
        mode={editing ? "edit" : "create"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
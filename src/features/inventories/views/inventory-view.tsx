"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
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
import { exportInventoryToExcel } from "@/features/inventories/lib/excel"
import { useProducts } from "@/features/products/hooks/use-products"
import { getApiErrorMessage } from "@/lib/api-client"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import type { InventoryDto } from "@/types/interfaces/inventory.interface"

export function InventoryView() {
  const { data: products = [] } = useProducts()
  const createInventory = useCreateInventory()
  const updateInventory = useUpdateInventory()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryDto | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [exportingId, setExportingId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const result = useInventories({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
  })
  const inventories = result.data?.data ?? []
  const totalItems = result.data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(result.data?.page ?? 1, totalPages)

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

  const handleExport = async (inventory: InventoryDto) => {
    setExportingId(inventory.id)
    try {
      await exportInventoryToExcel(inventory, products)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo exportar el inventario"))
    } finally {
      setExportingId(null)
    }
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

      {result.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <InventoriesTable
              inventories={inventories}
              onEdit={openEdit}
              onExport={handleExport}
              exportingId={exportingId}
            />
          </div>
          <div className="md:hidden">
            <InventoriesMobileList
              inventories={inventories}
              onEdit={openEdit}
              onExport={handleExport}
              exportingId={exportingId}
            />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
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
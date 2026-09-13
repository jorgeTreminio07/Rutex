"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { MermaDeleteDialog } from "@/features/mermas/components/merma-delete-dialog"
import { MermaFormDialog } from "@/features/mermas/components/merma-form-dialog"
import { MermasMobileList } from "@/features/mermas/components/mermas-mobile-list"
import { MermasTable } from "@/features/mermas/components/mermas-table"
import {
  useCreateMerma,
  useDeleteMerma,
  useMermaMotivos,
  useMermas,
  useUpdateMerma,
} from "@/features/mermas/hooks/use-mermas"
import { useProducts } from "@/features/products/hooks/use-products"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"
import type { MermaDto } from "@/types/interfaces/merma.interface"

export function MermaView() {
  const { data: motivos = [] } = useMermaMotivos()
  const { data: products = [] } = useProducts()
  const createMerma = useCreateMerma()
  const updateMerma = useUpdateMerma()
  const deleteMerma = useDeleteMerma()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MermaDto | null>(null)
  const [deleting, setDeleting] = useState<MermaDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useMermas({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
  })

  const mermas = data?.data ?? []
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

  const openEdit = (merma: MermaDto) => {
    setEditing(merma)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const handleSubmit = async (payload: {
    motivoId: number
    items: MermaDto["items"]
    observation: string | null
  }) => {
    if (editing) {
      await updateMerma.mutateAsync({ id: editing.id, payload })
    } else {
      await createMerma.mutateAsync(payload)
    }
    setFormOpen(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mermas</h1>
          <p className="text-sm text-muted-foreground">
            Bajas de stock por producto. Al guardar se descuenta del stock.
          </p>
          {!isLoading && !isError && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {totalItems} {totalItems === 1 ? "merma" : "mermas"}
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nueva merma
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudieron cargar las mermas."}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o motivo…"
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
            <MermasTable mermas={mermas} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <MermasMobileList mermas={mermas} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <MermaFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        products={products}
        motivos={motivos}
        initialMotivoId={editing?.motivoId ?? null}
        initialMotivoName={editing?.motivoName ?? null}
        initialItems={editing?.items ?? []}
        initialObservation={editing?.observation ?? null}
        isPending={createMerma.isPending || updateMerma.isPending}
        mode={editing ? "edit" : "create"}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <MermaDeleteDialog
        merma={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteMerma.isPending}
        onConfirm={async () => {
          if (!deleting) return
          const id = deleting.id
          setDeleting(null)
          try {
            await deleteMerma.mutateAsync(id)
          } catch {
            // el toast de error ya lo muestra useDeleteMerma
          }
        }}
      />
    </div>
  )
}
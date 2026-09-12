"use client"

import { PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
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
import { nicaDate } from "@/features/deliveries/lib/format"
import type { MermaDto } from "@/types/interfaces/merma.interface"

export function MermaView() {
  const { data: mermas = [], isLoading } = useMermas()
  const { data: motivos = [] } = useMermaMotivos()
  const { data: products = [] } = useProducts()
  const createMerma = useCreateMerma()
  const updateMerma = useUpdateMerma()
  const deleteMerma = useDeleteMerma()

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MermaDto | null>(null)
  const [deleting, setDeleting] = useState<MermaDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const filtered = mermas.filter((merma) => {
    if (dateFilter && nicaDate(merma.createdAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      const haystack = `${merma.mermaNumber} ${merma.motivoName}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mermas</h1>
          <p className="text-sm text-muted-foreground">
            Bajas de stock por producto. Al guardar se descuenta del stock.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nueva merma
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o motivo…"
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
            <MermasTable mermas={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <MermasMobileList mermas={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
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
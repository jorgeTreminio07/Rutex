"use client"

import { CheckIcon, Loader2Icon, PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useCreateRoute } from "@/features/routes/hooks/use-routes"
import { getCurrentPosition } from "@/features/routes/lib/route-path"
import { useCities } from "@/features/store/hooks/use-store"
import type { RouteType } from "@/types/interfaces/route.interface"

interface RouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RouteFormDialog({ open, onOpenChange }: RouteFormDialogProps) {
  const createRoute = useCreateRoute()
  const { data: clients = [] } = useClients()
  const { data: cities = [] } = useCities()

  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [type, setType] = useState<RouteType>("visita")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [locationError, setLocationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clients.filter((c) => {
      if (cityFilter && (c.city ?? "").trim().toLowerCase() !== cityFilter.trim().toLowerCase()) {
        return false
      }
      if (!q) return true
      return `${c.fullName} ${c.cedula ?? ""}`.toLowerCase().includes(q)
    })
  }, [clients, search, cityFilter])

  const selectedClients = useMemo(
    () =>
      selectedIds
        .map((id) => clients.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [selectedIds, clients],
  )

  const toggleClient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const reset = () => {
    setSearch("")
    setCityFilter("")
    setType("visita")
    setSelectedIds([])
    setLocationError(null)
    setSubmitting(false)
  }

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return
    setLocationError(null)
    setSubmitting(true)

    try {
      const start = await getCurrentPosition()
      if (!start) {
        setLocationError(
          "No pudimos obtener tu ubicación. Enciende la localización y acepta el permiso para calcular el orden de la mejor ruta.",
        )
        setSubmitting(false)
        return
      }

      await createRoute.mutateAsync({ type, clientIds: selectedIds, start })
      onOpenChange(false)
      reset()
    } catch {
      // El toast de error lo muestra useCreateRoute.
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Nueva ruta</DialogTitle>
          <DialogDescription>
            Elige el tipo de ruta y los clientes a visitar. Se usará tu ubicación
            actual para calcular y guardar el orden de la mejor ruta.
          </DialogDescription>
        </DialogHeader>

        {locationError && (
          <div className="mx-6 mb-4 rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {locationError}
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          {/* Tipo de ruta */}
          <div className="flex flex-col gap-2">
            <Label>Tipo de ruta</Label>
            <Select value={type} onValueChange={(value) => setType((value ?? "visita") as RouteType)}>
              <SelectTrigger className="max-w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visita">
                  <SelectItemText>Visita</SelectItemText>
                </SelectItem>
                <SelectItem value="entregas">
                  <SelectItemText>Entregas</SelectItemText>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de clientes */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nombre o cédula…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <Select value={cityFilter} onValueChange={(value) => setCityFilter(value ?? "")}>
              <SelectTrigger className="h-10 rounded-xl sm:w-52">
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <SelectItemText>Todas las ciudades</SelectItemText>
                </SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>
                    <SelectItemText>{city.name}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de clientes */}
          {filteredClients.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay clientes para mostrar.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredClients.map((client) => {
                const isSelected = selectedIds.includes(client.id)
                return (
                  <li
                    key={client.id}
                    className="flex items-start justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium leading-snug">
                        {client.fullName}
                      </p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">
                        {client.city ? (
                          <>
                            <span className="font-medium text-foreground">{client.city}</span>
                            {client.address ? ` · ${client.address}` : ""}
                          </>
                        ) : (
                          client.address ?? "Sin dirección"
                        )}
                      </p>
                      {client.cedula && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Cédula: {client.cedula}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="icon"
                      className="size-9 shrink-0 rounded-xl"
                      onClick={() => toggleClient(client.id)}
                      aria-label={
                        isSelected
                          ? `Quitar a ${client.fullName} de la ruta`
                          : `Agregar a ${client.fullName} a la ruta`
                      }
                    >
                      {isSelected ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Seleccionados */}
          {selectedClients.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Seleccionados ({selectedClients.length})
              </p>
              <ul className="flex flex-col gap-1">
                {selectedClients.map((client) => (
                  <li
                    key={client.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-background px-2.5 py-1.5"
                  >
                    <span className="min-w-0 break-words text-xs font-medium">{client.fullName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleClient(client.id)}
                      aria-label={`Quitar a ${client.fullName}`}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-3 rounded-b-xl border-t bg-muted/50 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <Badge variant={type === "visita" ? "secondary" : "outline"}>
              {type === "visita" ? "Visita" : "Entregas"}
            </Badge>{" "}
            · <span className="font-semibold text-foreground">{selectedClients.length}</span>{" "}
            {selectedClients.length === 1 ? "cliente" : "clientes"}
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting || createRoute.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || createRoute.isPending || selectedClients.length === 0}
            >
              {submitting || createRoute.isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Guardando…
                </>
              ) : (
                "Agregar ruta"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
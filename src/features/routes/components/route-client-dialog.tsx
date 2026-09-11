"use client"

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateRouteClient } from "@/features/routes/hooks/use-routes"
import type { RouteClientDto, RouteType } from "@/types/interfaces/route.interface"

interface RouteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routeCode: string
  routeType: RouteType
  client: RouteClientDto | null
}

export function RouteClientDialog({
  open,
  onOpenChange,
  routeCode,
  routeType,
  client,
}: RouteClientDialogProps) {
  const updateClient = useUpdateRouteClient(routeCode)
  const [observation, setObservation] = useState(client?.observation ?? "")

  if (!client) return null

  const isEntrega = routeType === "entregas"
  const completedLabel = isEntrega ? "Entrega completada" : "Visita completada"
  const cancelledLabel = isEntrega ? "Entrega cancelada" : "Visita cancelada"

  const handleStatus = (status: "completada" | "cancelada") => {
    if (updateClient.isPending) return
    updateClient.mutate(
      { clientId: client.clientId, payload: { status, observation: observation.trim() || null } },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{client.fullName}</DialogTitle>
          <DialogDescription>
            Registra el resultado de la {isEntrega ? "entrega" : "visita"} o agrega una observación.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {client.city && <Badge variant="secondary">{client.city}</Badge>}
            <span>{client.address ?? "Sin dirección"}</span>
          </div>
          {client.phone && (
            <p className="text-xs text-muted-foreground">Teléfono: {client.phone}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`obs-${client.id}`}>Observación</Label>
            <Textarea
              id={`obs-${client.id}`}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Escribe una observación de la visita o entrega…"
              className="min-h-24 resize-y"
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded-b-xl border-t bg-muted/50 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="sm:order-first"
            disabled={updateClient.isPending}
            onClick={() => handleStatus("cancelada")}
          >
            {updateClient.isPending ? <Loader2Icon className="animate-spin" /> : <XIcon />}
            {cancelledLabel}
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={updateClient.isPending}
            onClick={() => handleStatus("completada")}
          >
            {updateClient.isPending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
            {completedLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
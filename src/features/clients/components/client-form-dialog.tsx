"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, MapPinIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { ReactNode } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea"
import { MapPicker, type MapCoords } from "@/features/clients/components/map-picker"
import { useCities } from "@/features/store/hooks/use-store"
import {
  clientSchema,
  type ClientFormValues,
} from "@/features/clients/validations/client.schema"
import type { ClientDto } from "@/types/interfaces/client.interface"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ClientDto | null
  isPending: boolean
  onSubmit: (values: ClientFormValues) => Promise<void>
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function CityField({
  value,
  onChange,
  cities,
}: {
  value: string
  onChange: (value: string) => void
  cities: { id: number; name: string }[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <SelectTrigger id="client-city">
        <SelectValue>
          {(selected) => (selected ? selected : "Selecciona una ciudad")}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <SelectItemText>Selecciona una ciudad</SelectItemText>
        </SelectItem>
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.name}>
            <SelectItemText>{city.name}</SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  isPending,
  onSubmit,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client)
  const [mapOpen, setMapOpen] = useState(false)
  const { data: cities = [] } = useCities()

  const form = useForm<z.input<typeof clientSchema>, unknown, z.output<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: client?.fullName ?? "",
      phone: client?.phone ?? "",
      cedula: client?.cedula ?? "",
      address: client?.address ?? "",
      city: client?.city ?? "",
      latitude: client?.latitude != null ? String(client.latitude) : "",
      longitude: client?.longitude != null ? String(client.longitude) : "",
    },
  })

  const cedula = useWatch({ control: form.control, name: "cedula" }) ?? ""
  const city = useWatch({ control: form.control, name: "city" }) ?? ""
  const latitude = (useWatch({ control: form.control, name: "latitude" }) as string) ?? ""
  const longitude = (useWatch({ control: form.control, name: "longitude" }) as string) ?? ""

  const coords = useMemo<MapCoords | null>(() => {
    if (latitude === "" && longitude === "") return null
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }, [latitude, longitude])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("latitude", position.coords.latitude.toFixed(6))
        form.setValue("longitude", position.coords.longitude.toFixed(6))
      },
      () => toast.error("No se pudo obtener tu ubicación"),
    )
  }

  const locationError =
    form.formState.errors.latitude?.message ?? form.formState.errors.longitude?.message

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values)
          })}
          className="flex flex-col gap-4"
        >
          <Field label="Nombre completo *" htmlFor="client-name" error={form.formState.errors.fullName?.message}>
            <Input
              id="client-name"
              className="h-10 rounded-xl"
              placeholder="ej. María López"
              aria-invalid={!!form.formState.errors.fullName}
              {...form.register("fullName")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Número teléfono *" htmlFor="client-phone" error={form.formState.errors.phone?.message}>
              <Input
                id="client-phone"
                type="tel"
                className="h-10 rounded-xl"
                placeholder="ej. 8888 8888"
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
            </Field>
            <Field label="Cédula (sin guiones)" htmlFor="client-cedula" error={form.formState.errors.cedula?.message}>
              <Input
                id="client-cedula"
                className="h-10 rounded-xl"
                placeholder="ej. 0011234567890A"
                value={cedula}
                aria-invalid={!!form.formState.errors.cedula}
                onChange={(e) =>
                  form.setValue("cedula", e.target.value.replace(/[-]/g, ""), { shouldValidate: true })
                }
              />
            </Field>
          </div>

          <Field label="Dirección" htmlFor="client-address" error={form.formState.errors.address?.message}>
            <Textarea
              id="client-address"
              className="rounded-xl"
              placeholder="Describe la dirección del cliente..."
              aria-invalid={!!form.formState.errors.address}
              {...form.register("address")}
            />
          </Field>

          <Field label="Ciudad" htmlFor="client-city" error={form.formState.errors.city?.message}>
            <CityField
              value={city ?? ""}
              onChange={(value) => form.setValue("city", value, { shouldValidate: true })}
              cities={cities}
            />
          </Field>

          <Field
            label="Coordenadas de ubicación"
            htmlFor="client-latitude"
            error={locationError}
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="client-latitude"
                type="number"
                step="0.000001"
                className="h-10 rounded-xl"
                placeholder="Latitud"
                value={latitude}
                onChange={(e) =>
                  form.setValue("latitude", e.target.value, { shouldValidate: true })
                }
              />
              <Input
                id="client-longitude"
                type="number"
                step="0.000001"
                className="h-10 rounded-xl"
                placeholder="Longitud"
                value={longitude}
                onChange={(e) =>
                  form.setValue("longitude", e.target.value, { shouldValidate: true })
                }
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setMapOpen((value) => !value)}
            >
              <MapPinIcon />
              {mapOpen ? "Ocultar mapa" : "Abrir mapa para elegir ubicación"}
            </Button>

            {mapOpen && (
              <div className="flex flex-col gap-2">
                <MapPicker
                  value={coords}
                  onPick={(picked) => {
                    form.setValue("latitude", picked.lat.toFixed(6), { shouldValidate: true })
                    form.setValue("longitude", picked.lng.toFixed(6), { shouldValidate: true })
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUseMyLocation}
                  >
                    Usar mi ubicación
                  </Button>
                  {coords && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        form.setValue("latitude", "")
                        form.setValue("longitude", "")
                      }}
                    >
                      Quitar ubicación
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Guardando…
                </>
              ) : (
                <>{isEditing ? "Guardar cambios" : "Crear cliente"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
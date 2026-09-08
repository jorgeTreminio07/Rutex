"use client"

import { MapPinIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddCity,
  useCities,
  useDeleteCity,
} from "@/features/store/hooks/use-store"

export function CitiesSection() {
  const { data: cities = [], isLoading } = useCities()
  const addCity = useAddCity()
  const deleteCity = useDeleteCity()

  const [name, setName] = useState("")

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const value = name.trim()
    if (!value || addCity.isPending) return
    try {
      await addCity.mutateAsync({ name: value })
      setName("")
    } catch {
      // El toast de error lo muestra el hook
    }
  }

  return (
    <Card>
      <CardHeader className="@container/card-header">
        <CardTitle>Ciudades</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la ciudad (ej. Managua)"
            className="h-10 flex-1 rounded-xl"
            maxLength={80}
            aria-label="Nombre de la ciudad"
          />
          <Button type="submit" size="sm" disabled={addCity.isPending || !name.trim()}>
            <PlusIcon />
            Agregar
          </Button>
        </form>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : cities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MapPinIcon className="size-5" />
            </span>
            <p className="text-sm font-medium">Aún no hay ciudades</p>
            <p className="text-xs text-muted-foreground">
              Agrega las ciudades donde realizas entregas.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {cities.map((city) => (
              <li
                key={city.id}
                className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
                    {city.id}
                  </span>
                  <span className="truncate text-sm font-medium">{city.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar ciudad ${city.name}`}
                  className="text-destructive hover:text-destructive"
                  disabled={deleteCity.isPending}
                  onClick={() => deleteCity.mutate(city.id)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
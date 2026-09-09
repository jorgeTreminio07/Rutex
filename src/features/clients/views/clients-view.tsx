"use client"

import { PlusIcon, SearchIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientDeleteDialog } from "@/features/clients/components/client-delete-dialog"
import { ClientFormDialog } from "@/features/clients/components/client-form-dialog"
import { ClientsMobileList } from "@/features/clients/components/clients-mobile-list"
import { ClientsTable } from "@/features/clients/components/clients-table"
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/features/clients/hooks/use-clients"
import type { ClientFormValues } from "@/features/clients/validations/client.schema"
import type { ClientDto } from "@/types/interfaces/client.interface"

export function ClientsView() {
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ClientDto | null>(null)
  const [deleting, setDeleting] = useState<ClientDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const filtered = clients.filter((client) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      client.fullName.toLowerCase().includes(q) ||
      (client.cedula ?? "").toLowerCase().includes(q)
    )
  })

  const buildPayload = (values: ClientFormValues) => ({
    fullName: values.fullName,
    phone: values.phone,
    cedula: values.cedula?.trim() || null,
    address: values.address?.trim() || null,
    city: values.city?.trim() || null,
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
  })

  const handleCreate = async (values: ClientFormValues) => {
    await createClient.mutateAsync(buildPayload(values))
    setFormOpen(false)
  }

  const handleUpdate = async (values: ClientFormValues) => {
    if (!editing) return
    await updateClient.mutateAsync({ id: editing.id, payload: buildPayload(values) })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const openEdit = (client: ClientDto) => {
    setEditing(client)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Directorio de clientes de la tienda.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Agregar cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o cédula…"
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
            <ClientsTable clients={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <ClientsMobileList clients={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        </>
      )}

      <ClientFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        isPending={createClient.isPending || updateClient.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ClientDeleteDialog
        client={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteClient.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteClient.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
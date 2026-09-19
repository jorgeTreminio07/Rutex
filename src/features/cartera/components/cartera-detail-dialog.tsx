"use client"

import {
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  CoinsIcon,
  Loader2Icon,
  PencilIcon,
  PhoneIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { fmtMoney } from "@/lib/format"
import { useEditarAbono, useEliminarAbono, useRegistrarAbono } from "@/features/cartera/hooks/use-cartera"
import {
  abonoEstadoLabel,
  type AbonoRegistroDto,
  type CarteraPagoDto,
} from "@/types/interfaces/cartera.interface"

function statusVariant(estadoPagoId: number): "default" | "secondary" | "destructive" | "outline" {
  if (estadoPagoId === 2) return "default"
  if (estadoPagoId === 3) return "destructive"
  return "secondary"
}

function abonoVariant(abono: { pagado: boolean; fechaAbonar: string }): "default" | "secondary" | "destructive" | "outline" {
  const label = abonoEstadoLabel(abono)
  if (label === "Pagado") return "default"
  if (label === "Vencido") return "destructive"
  return "secondary"
}

function paymentTypeLabel(paymentType: string): string {
  if (paymentType === "cuotas_2") return "2 quincenas"
  if (paymentType === "cuotas_4") return "4 semanas"
  return "Contado"
}

function nicaDate(dateStr: string | null): string {
  if (!dateStr) return ""
  // createdAt / fechaPago llegan como ISO con hora -> convertir a día en Nicaragua.
  return dateStr.includes("T")
    ? new Date(new Date(dateStr).getTime() - 6 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : dateStr
}

interface CarteraDetailDialogProps {
  order: CarteraPagoDto | null
  onOpenChange: (open: boolean) => void
}

interface AbonoDeleteDialogProps {
  registro: AbonoRegistroDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

function AbonoDeleteDialog({
  registro,
  onOpenChange,
  isPending,
  onConfirm,
}: AbonoDeleteDialogProps) {
  return (
    <Dialog open={registro !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar abono</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar el abono de {fmtMoney(registro?.monto ?? 0)} registrado el{" "}
            {registro && nicaDate(registro.fecha)}? Se reajustará el saldo y el estado de pago del
            pedido. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Eliminando…" : "Eliminar abono"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CarteraDetailDialog({ order, onOpenChange }: CarteraDetailDialogProps) {
  const [monto, setMonto] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMonto, setEditMonto] = useState("")
  const [deletingRegistro, setDeletingRegistro] = useState<AbonoRegistroDto | null>(null)
  const registrar = useRegistrarAbono()
  const editar = useEditarAbono()
  const eliminar = useEliminarAbono()

  if (!order) return <Dialog open={false} onOpenChange={onOpenChange} />

  const saldo = order.saldo
  const saldado = saldo <= 0
  const anyPending = registrar.isPending || editar.isPending || eliminar.isPending

  const registrosConSaldo = order.registros.reduce(
    (acc, registro) => {
      const saldoRestante =
        acc.length === 0 ? order.total - registro.monto : acc[acc.length - 1].saldoRestante - registro.monto
      acc.push({ ...registro, saldoRestante: Math.max(0, saldoRestante) })
      return acc
    },
    [] as Array<AbonoRegistroDto & { saldoRestante: number }>,
  )

  const handleRegistrar = async () => {
    const value = Number(monto)
    if (!Number.isFinite(value) || value <= 0) return
    if (value > saldo) return
    try {
      await registrar.mutateAsync({ orderId: order.id, monto: value })
      setMonto("")
    } catch {
      // El toast de error lo muestra el hook
    }
  }

  const startEdit = (registro: AbonoRegistroDto) => {
    setEditingId(registro.id)
    setEditMonto(String(registro.monto))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditMonto("")
  }

  const handleGuardarEdit = async (registro: AbonoRegistroDto) => {
    const value = Number(editMonto)
    if (!Number.isFinite(value) || value <= 0) return
    try {
      await editar.mutateAsync({ orderId: order.id, registroId: registro.id, monto: value })
      setEditingId(null)
      setEditMonto("")
    } catch {
      // El toast de error lo muestra el hook
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingRegistro) return
    try {
      await eliminar.mutateAsync({ orderId: order.id, registroId: deletingRegistro.id })
      setDeletingRegistro(null)
    } catch {
      // El toast de error lo muestra el hook
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!anyPending} className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <CoinsIcon className="size-4 text-muted-foreground" />
              <DialogTitle className="font-mono">{order.orderNumber || "Sin número"}</DialogTitle>
              <Badge variant={statusVariant(order.estadoPagoId)}>{order.estadoPago}</Badge>
            </div>
          </DialogHeader>

          <div className="-mx-4 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-4">
            <div className="space-y-2 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="font-semibold">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhoneIcon className="size-4" />
                  {order.customerPhone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4" />
                {nicaDate(order.createdAt)} · {paymentTypeLabel(order.paymentType)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Deuda total</p>
                <p className="font-bold">{fmtMoney(order.total)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Total abonado</p>
                <p className="font-bold text-primary">{fmtMoney(order.abonado)}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Saldo restante</p>
                <p className={`font-bold ${saldado ? "text-primary" : "text-destructive"}`}>
                  {fmtMoney(saldo)}
                </p>
              </div>
            </div>

            {registrosConSaldo.map((registro) => {
              const isEditing = editingId === registro.id
              return (
                <div
                  key={registro.id}
                  className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
                      {isEditing ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            value={editMonto}
                            onChange={(e) => setEditMonto(e.target.value)}
                            disabled={editar.isPending}
                            className="h-9 w-32 rounded-lg"
                            aria-label="Monto del abono"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 gap-1"
                            disabled={editar.isPending || !(Number(editMonto) > 0)}
                            onClick={() => handleGuardarEdit(registro)}
                          >
                            {editar.isPending ? (
                              <Loader2Icon className="size-4 animate-spin" />
                            ) : (
                              <CheckIcon className="size-4" />
                            )}
                            Guardar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-9"
                            disabled={editar.isPending}
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{nicaDate(registro.fecha)}</p>
                          <p className="text-xs text-muted-foreground">
                            {fmtMoney(registro.monto)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="hidden text-xs text-muted-foreground sm:block">
                        Saldo restante {fmtMoney(registro.saldoRestante)}
                      </p>
                      {!isEditing && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => startEdit(registro)}
                            disabled={anyPending}
                            aria-label={`Editar abono del ${nicaDate(registro.fecha)}`}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive"
                            onClick={() => setDeletingRegistro(registro)}
                            disabled={anyPending}
                            aria-label={`Eliminar abono del ${nicaDate(registro.fecha)}`}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {registrosConSaldo.length === 0 && (
              <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                Aún no se han registrado abonos.
              </p>
            )}

            <div className="rounded-xl border p-4">
              <p className="text-sm font-semibold">Fechas de pago / montos</p>
              <div className="mt-2 divide-y">
                {order.abonos.length === 0 && (
                  <p className="py-2 text-sm text-muted-foreground">Sin abonos registrados.</p>
                )}
                {order.abonos.map((abono, index) => (
                  <div key={abono.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">
                        Fecha {index + 1} <span className="text-muted-foreground">· {nicaDate(abono.fechaAbonar)}</span>
                      </p>
                      {abono.abonado > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Abonado {fmtMoney(abono.abonado)}
                          {abono.fechaPago
                            ? ` · ${nicaDate(abono.fechaPago)}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fmtMoney(abono.montoAbonar)}</span>
                      <Badge variant={abonoVariant(abono)}>{abonoEstadoLabel(abono)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            {saldado ? (
              <p className="w-full rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary">
                Pedido saldado, no se pueden registrar más abonos.
              </p>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="Monto del abono (C$)"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    disabled={anyPending}
                    className="h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="default"
                    className="shrink-0 gap-2"
                    disabled={anyPending || !(Number(monto) > 0)}
                    onClick={handleRegistrar}
                  >
                    <CoinsIcon className="size-4" />
                    {registrar.isPending ? "Registrando…" : "Registrar abono"}
                  </Button>
                </div>
                {Number(monto) > saldo && (
                  <p className="text-xs font-medium text-destructive">
                    El abono sobrepasa el saldo restante ({fmtMoney(saldo)}).
                  </p>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AbonoDeleteDialog
        registro={deletingRegistro}
        onOpenChange={(open) => {
          if (!open) setDeletingRegistro(null)
        }}
        isPending={eliminar.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
"use client"

import { CalendarIcon, CheckCircle2Icon, CoinsIcon, PhoneIcon, UserIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRegistrarAbono } from "@/features/cartera/hooks/use-cartera"
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

export function CarteraDetailDialog({ order, onOpenChange }: CarteraDetailDialogProps) {
  const [monto, setMonto] = useState("")
  const registrar = useRegistrarAbono()

  if (!order) return <Dialog open={false} onOpenChange={onOpenChange} />

  const saldo = order.saldo
  const saldado = saldo <= 0

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

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!registrar.isPending} className="sm:max-w-lg">
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
              <p className="font-bold">C$ {order.total.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Total abonado</p>
              <p className="font-bold text-primary">C$ {order.abonado.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">Saldo restante</p>
              <p className={`font-bold ${saldado ? "text-primary" : "text-destructive"}`}>
                C$ {saldo.toFixed(2)}
              </p>
            </div>
          </div>

          {registrosConSaldo.map((registro) => (
            <div
              key={registro.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2Icon className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{nicaDate(registro.fecha)}</p>
                  <p className="text-xs text-muted-foreground">C$ {registro.monto.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Saldo restante C$ {registro.saldoRestante.toFixed(2)}
              </p>
            </div>
          ))}
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
                        Abonado C$ {abono.abonado.toFixed(2)}
                        {abono.fechaPago
                          ? ` · ${nicaDate(abono.fechaPago)}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">C$ {abono.montoAbonar.toFixed(2)}</span>
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
                  disabled={registrar.isPending}
                  className="h-10 rounded-xl"
                />
                <Button
                  type="button"
                  variant="default"
                  className="shrink-0 gap-2"
                  disabled={registrar.isPending || !(Number(monto) > 0)}
                  onClick={handleRegistrar}
                >
                  <CoinsIcon className="size-4" />
                  {registrar.isPending ? "Registrando…" : "Registrar abono"}
                </Button>
              </div>
              {Number(monto) > saldo && (
                <p className="text-xs font-medium text-destructive">
                  El abono sobrepasa el saldo restante (C$ {saldo.toFixed(2)}).
                </p>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { LandmarkIcon, PencilIcon, QrCodeIcon, Trash2Icon } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAssetUrl } from "@/lib/assets"
import type { BankAccountDto } from "@/types/interfaces/store.interface"

interface BankAccountsListProps {
  accounts: BankAccountDto[]
  onEdit: (account: BankAccountDto) => void
  onDelete: (account: BankAccountDto) => void
}

export function BankAccountsList({ accounts, onEdit, onDelete }: BankAccountsListProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LandmarkIcon className="size-5" />
        </span>
        <p className="text-sm font-medium">Aún no hay cuentas bancarias</p>
        <p className="text-xs text-muted-foreground">
          Agrega una cuenta para recibir pagos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {accounts.map((account) => {
        const qrUrl = account.qrUrl ? getAssetUrl(account.qrUrl) : null
        return (
          <Card key={account.id} size="sm">
            <CardHeader className="gap-2">
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{account.bankName}</span>
                <Badge variant="secondary">{account.currency}</Badge>
              </CardTitle>
              <p className="truncate font-mono text-sm text-foreground">
                •••• {account.lastFourDigits}
              </p>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate text-xs text-muted-foreground">{account.accountHolder}</span>
                {qrUrl && (
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir QR de ${account.bankName}`}
                    title="Abrir QR de pago"
                    className="shrink-0"
                  >
                    <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                      <Image
                        src={qrUrl}
                        alt={`QR de ${account.bankName}`}
                        width={48}
                        height={48}
                        unoptimized
                        className="size-full object-contain"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <QrCodeIcon className="size-6 text-white" />
                      </span>
                    </span>
                  </a>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar cuenta de ${account.bankName}`}
                  onClick={() => onEdit(account)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar cuenta de ${account.bankName}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(account)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
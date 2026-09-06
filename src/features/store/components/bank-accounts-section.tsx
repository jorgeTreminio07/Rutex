"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BankAccountDeleteDialog } from "@/features/store/components/bank-account-delete-dialog"
import { BankAccountFormDialog } from "@/features/store/components/bank-account-form-dialog"
import { BankAccountsList } from "@/features/store/components/bank-accounts-list"
import {
  useAddBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from "@/features/store/hooks/use-store"
import type { BankAccountFormValues } from "@/features/store/validations/store.schema"
import type { BankAccountDto } from "@/types/interfaces/store.interface"

interface BankAccountsSectionProps {
  accounts: BankAccountDto[]
}

export function BankAccountsSection({ accounts }: BankAccountsSectionProps) {
  const addBankAccount = useAddBankAccount()
  const updateBankAccount = useUpdateBankAccount()
  const deleteBankAccount = useDeleteBankAccount()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BankAccountDto | null>(null)
  const [deleting, setDeleting] = useState<BankAccountDto | null>(null)

  const handleCreate = async (values: BankAccountFormValues) => {
    await addBankAccount.mutateAsync({
      bankName: values.bankName,
      currency: values.currency,
      accountNumber: values.accountNumber ?? "",
      accountHolder: values.accountHolder,
      qrCode: values.qrCode ?? null,
      removeQr: values.removeQr,
    })
    setFormOpen(false)
  }

  const handleUpdate = async (values: BankAccountFormValues) => {
    if (!editing) return
    await updateBankAccount.mutateAsync({
      id: editing.id,
      payload: {
        bankName: values.bankName,
        currency: values.currency,
        accountNumber: values.accountNumber ?? "",
        accountHolder: values.accountHolder,
        qrCode: values.qrCode ?? null,
        removeQr: values.removeQr,
      },
    })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (account: BankAccountDto) => {
    setEditing(account)
    setFormOpen(true)
  }

  return (
    <Card>
      <CardHeader className="@container/card-header">
        <CardTitle>Cuentas bancarias</CardTitle>
        {/* <CardDescription>Recibe pagos a través de estas cuentas.</CardDescription> */}
        <CardAction>
          <Button size="sm" onClick={openCreate}>
            <PlusIcon />
            Agregar cuenta
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <BankAccountsList accounts={accounts} onEdit={openEdit} onDelete={setDeleting} />
      </CardContent>

      <BankAccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        isPending={addBankAccount.isPending || updateBankAccount.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <BankAccountDeleteDialog
        account={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteBankAccount.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteBankAccount.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </Card>
  )
}
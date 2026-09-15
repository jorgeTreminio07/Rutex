"use client"

import { BankAccountsSection } from "@/features/store/components/bank-accounts-section"
import { CitiesSection } from "@/features/store/components/cities-section"
import { StoreForm } from "@/features/store/components/store-form"
import { useStore, useUpdateStore } from "@/features/store/hooks/use-store"
import type { StoreFormValues } from "@/features/store/validations/store.schema"

export function StoreSettingsView() {
  const { data: store } = useStore()
  const updateStore = useUpdateStore()

  const handleSubmit = async (values: StoreFormValues) => {
    await updateStore.mutateAsync({
      name: values.name,
      ownerName: values.ownerName || undefined,
      ruc: values.ruc || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      phone: values.phone || undefined,
      workingHours: values.workingHours || undefined,
      paymentPlansEnabled: values.paymentPlansEnabled,
      showStockInCatalog: values.showStockInCatalog,
      logo: values.logo,
      stamp: values.stamp,
      signature: values.signature,
      removeLogo: values.removeLogo,
      removeStamp: values.removeStamp,
      removeSignature: values.removeSignature,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Configuración</h1>
      </div>

      <StoreForm store={store ?? undefined} isPending={updateStore.isPending} onSubmit={handleSubmit} />
      <BankAccountsSection accounts={store?.bankAccounts ?? []} />
      <CitiesSection />
    </div>
  )
}
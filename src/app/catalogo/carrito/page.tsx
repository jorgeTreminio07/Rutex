"use client"

import { ArrowLeftIcon, StoreIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { CatalogCart } from "@/features/catalog/components/catalog-cart"
import { useCatalog } from "@/features/catalog/hooks/use-catalog"
import { useCartStore } from "@/features/catalog/store/use-cart-store"
import { getAssetUrl } from "@/lib/assets"

export default function CarritoPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data } = useCatalog()
  const { items, updateQuantity, removeItem, clear } = useCartStore()

  const store = data?.store ?? { name: "Rutex", logoUrl: null, phone: null, paymentPlansEnabled: true, showStockInCatalog: false }
  const bankAccounts = data?.bankAccounts ?? []
  const logoUrl = getAssetUrl(store.logoUrl)

  const goToStore = () => router.push("/catalogo")

  const content = (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <div className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={store.name} width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StoreIcon className="size-5" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">{store.name}</h1>
            <p className="text-xs text-muted-foreground">Tienda oficial · Tu carrito</p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={goToStore}>
          <ArrowLeftIcon className="size-4" />
          Ver catálogo
        </Button>
      </div>

      <CatalogCart
        items={items}
        storeName={store.name}
        storePhone={store.phone}
        bankAccounts={bankAccounts}
        paymentPlansEnabled={store.paymentPlansEnabled}
        isAuthenticated={isAuthenticated}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClear={clear}
        onGoBack={goToStore}
      />
    </div>
  )

  if (isAuthenticated) {
    return <DashboardShell>{content}</DashboardShell>
  }

  return (
    <div className="min-h-dvh bg-background pb-[env(safe-area-inset-bottom)]">
      {content}
    </div>
  )
}
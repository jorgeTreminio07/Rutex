"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { CatalogView } from "@/features/catalog/views/catalog-view"

export default function CatalogoPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) router.prefetch("/")
  }, [user, router])

  const content = <CatalogView isAuthenticated={isAuthenticated} />

  if (isAuthenticated) {
    return <DashboardShell>{content}</DashboardShell>
  }

  return (
    <div className="min-h-dvh bg-background pb-[env(safe-area-inset-bottom)]">
      {content}
    </div>
  )
}
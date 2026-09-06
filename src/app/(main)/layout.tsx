"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { DashboardShell } from "@/components/layout/dashboard-shell"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <DashboardShell>{children}</DashboardShell>
}
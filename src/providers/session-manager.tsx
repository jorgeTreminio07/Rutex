"use client"

import { useEffect } from "react"

import { sessionRequest } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

export function SessionManager({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const clear = useAuthStore((s) => s.clear)
  const markHydrated = useAuthStore((s) => s.markHydrated)

  useEffect(() => {
    let cancelled = false

    async function rehydrate() {
      try {
        const user = await sessionRequest()
        if (!cancelled) setUser(user)
      } catch {
        if (!cancelled) clear()
      } finally {
        if (!cancelled) markHydrated()
      }
    }

    rehydrate()
    return () => {
      cancelled = true
    }
  }, [clear, markHydrated, setUser])

  return children
}
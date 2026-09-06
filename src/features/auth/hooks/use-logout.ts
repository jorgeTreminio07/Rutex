"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { logoutRequest } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

export function useLogout() {
  const router = useRouter()
  const clear = useAuthStore((s) => s.clear)

  return useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // La limpieza local se ejecuta igualmente
    }
    clear()
    router.replace("/login")
  }, [clear, router])
}
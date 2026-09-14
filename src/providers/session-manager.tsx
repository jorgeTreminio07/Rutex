"use client"

import { useEffect, useRef } from "react"

import { sessionRequest } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

const RETRY_DELAYS_MS = [700, 2000, 5000]
const MAX_RETRIES = RETRY_DELAYS_MS.length

export function SessionManager({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const markHydrated = useAuthStore((s) => s.markHydrated)
  const retriesRef = useRef(0)
  const hydratedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function run() {
      if (cancelled) return
      try {
        const user = await sessionRequest()
        if (cancelled) return
        retriesRef.current = 0
        hydratedRef.current = true
        // setUser(null) solo ocurre cuando el servidor responde explícitamente
        // "no hay sesión" (usuario no logueado → login). Un error de red jamás
        // llega aquí.
        setUser(user)
        markHydrated()
      } catch {
        if (cancelled) return
        if (hydratedRef.current) return
        // Primera carga: reintentar antes de decidir que no hay sesión, para no
        // desloguear por un fallo transitorio (típico en redes móviles).
        if (retriesRef.current < MAX_RETRIES) {
          timer = setTimeout(run, RETRY_DELAYS_MS[retriesRef.current])
          retriesRef.current += 1
          return
        }
        markHydrated()
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && hydratedRef.current) run()
    }

    function onFocus() {
      if (hydratedRef.current) run()
    }

    run()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [markHydrated, setUser])

  return children
}
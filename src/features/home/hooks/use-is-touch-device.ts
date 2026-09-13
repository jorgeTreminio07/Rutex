"use client"

import { useEffect, useState } from "react"

/**
 * Detecta dispositivos táctiles (pointer: coarse) después del montaje para
 * evitar la diferencia de hidratación (SSR parte en false).
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)")
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return isTouch
}
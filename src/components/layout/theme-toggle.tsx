"use client"

import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Activar modo oscuro"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors duration-500 outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
        isDark ? "border-transparent bg-primary" : "border-border bg-input/50"
      )}
    >
      <span
        className={cn(
          "relative flex size-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform duration-500 ease-in-out",
          isDark ? "translate-x-5" : "translate-x-0"
        )}
      >
        <SunIcon
          className={cn(
            "absolute size-3.5 text-amber-500 transition-all duration-500 ease-in-out",
            isDark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
        <MoonIcon
          className={cn(
            "absolute size-3.5 text-yellow-300 transition-all duration-500 ease-in-out",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0"
          )}
        />
      </span>
    </button>
  )
}
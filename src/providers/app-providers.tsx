"use client"

import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/providers/query-client-provider"
import { SessionManager } from "@/providers/session-manager"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryProvider>
        <SessionManager>{children}</SessionManager>
        <Toaster />
      </QueryProvider>
    </ThemeProvider>
  )
}
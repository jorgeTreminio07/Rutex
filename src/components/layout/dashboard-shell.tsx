"use client"

import { useState } from "react"

import { DesktopNavbar } from "@/components/layout/navbar"
import { MobileAppBar } from "@/components/layout/mobile-app-bar"
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet"
import { MobileTabBar } from "@/components/layout/mobile-tab-bar"
import { Sidebar } from "@/components/layout/sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <DesktopNavbar />
        <MobileAppBar onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-6 md:pb-6">
          {children}
        </main>
      </div>

      <MobileTabBar />
      <MobileNavSheet open={navOpen} onOpenChange={setNavOpen} />
    </div>
  )
}
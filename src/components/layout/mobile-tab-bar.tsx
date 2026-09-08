"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MOBILE_TABS, type NavItem } from "@/components/layout/navigation"
import { cn } from "@/lib/utils"

function isTabActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/"
  if (item.href === "/usuarios") {
    return pathname === "/usuarios" || (pathname.startsWith("/usuarios/") && !pathname.startsWith("/usuarios/roles"))
  }
  return pathname === item.href
}

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex h-16 items-stretch">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const active = isTabActive(tab, pathname)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] transition-colors",
                active ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/15",
                )}
              >
                <Icon className="size-5" />
              </span>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
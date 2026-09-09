"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronDownIcon, XIcon } from "lucide-react"

import { StoreLogo } from "@/components/layout/store-logo"
import { NAV_CLIENTS, NAV_CONFIG, NAV_HOME, SIDEBAR_GROUPS, type NavItem } from "@/components/layout/navigation"
import { useStore } from "@/features/store/hooks/use-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileNavSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MobileNavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary font-medium text-primary-foreground"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export function MobileNavSheet({ open, onOpenChange }: MobileNavSheetProps) {
  const pathname = usePathname()
  const { data: store } = useStore()
  const brandName = store?.name ?? "Rutex"

  const [manuallyOpen, setManuallyOpen] = useState<Record<string, boolean>>({})

  const isGroupActive = (label: string) => {
    const group = SIDEBAR_GROUPS.find((g) => g.label === label)
    return group?.items.some((i) => pathname === i.href) ?? false
  }

  const isGroupVisible = (label: string) => manuallyOpen[label] ?? isGroupActive(label)

  const toggleGroup = (label: string) => {
    setManuallyOpen((prev) => ({ ...prev, [label]: !isGroupVisible(label) }))
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const close = () => onOpenChange(false)

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />

      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background shadow-xl">
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <StoreLogo size="sm" />
              <span className="truncate">{brandName}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Cerrar menú">
              <XIcon />
            </Button>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <MobileNavLink item={NAV_HOME} active={pathname === "/"} onNavigate={close} />

          {SIDEBAR_GROUPS.map((group) => {
            const GroupIcon = group.icon
            const visible = isGroupVisible(group.label)
            return (
              <div key={group.label} className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={visible}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <GroupIcon className="size-4 shrink-0" />
                  {group.label}
                  <ChevronDownIcon
                    className={cn(
                      "ml-auto size-4 transition-transform duration-200",
                      visible && "rotate-180",
                    )}
                  />
                </button>
                {visible && (
                  <div className="ml-4 flex flex-col gap-1 border-l pl-3">
                    {group.items.map((item) => (
                      <MobileNavLink
                        key={item.href}
                        item={item}
                        active={pathname === item.href}
                        onNavigate={close}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <MobileNavLink
            item={NAV_CLIENTS}
            active={pathname === "/clientes"}
            onNavigate={close}
          />

          <MobileNavLink
            item={NAV_CONFIG}
            active={pathname === "/configuracion"}
            onNavigate={close}
          />
        </nav>

        <div className="border-t px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-xs text-muted-foreground">
          Rutex · v0.1.0
        </div>
      </div>
    </div>
  )
}
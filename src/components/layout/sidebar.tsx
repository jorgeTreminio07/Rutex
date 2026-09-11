"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDownIcon } from "lucide-react"

import { StoreLogo } from "@/components/layout/store-logo"
import { NAV_CLIENTS, NAV_CONFIG, NAV_HOME, NAV_ROUTES, SIDEBAR_GROUPS, type NavItem } from "@/components/layout/navigation"
import { useStore } from "@/features/store/hooks/use-store"
import { cn } from "@/lib/utils"

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && item.label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = SIDEBAR_GROUPS.filter((g) => g.items.some((i) => pathname === i.href)).map((g) => g.label)
    return new Set(active.length > 0 ? active : ["Usuarios"])
  })
  const { data: store } = useStore()
  const brandName = store?.name ?? "Rutex"

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        title={collapsed ? "Expandir menú" : "Contraer menú"}
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-[14px] transition-colors hover:bg-sidebar-accent/60"
      >
        <StoreLogo />
        <span
          className={cn(
            "truncate font-heading text-base font-semibold",
            collapsed && "hidden",
          )}
        >
          {brandName}
        </span>
      </button>

      <nav className="flex flex-1 flex-col gap-1 overflow-hidden p-3">
        <SidebarLink item={NAV_HOME} active={pathname === "/"} collapsed={collapsed} />

        {SIDEBAR_GROUPS.map((group) => {
          const GroupIcon = group.icon
          return (
            <div key={group.label} className="flex w-full flex-col gap-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                aria-expanded={openGroups.has(group.label)}
                title={collapsed ? group.label : undefined}
                aria-label={collapsed ? group.label : undefined}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
              >
                <GroupIcon className="size-4 shrink-0" />
                {!collapsed && (
                  <>
                    {group.label}
                    <ChevronDownIcon
                      className={cn(
                        "ml-auto size-4 transition-transform duration-200",
                        openGroups.has(group.label) && "rotate-180",
                      )}
                    />
                  </>
                )}
              </button>
              {openGroups.has(group.label) && (
                <div className={cn("flex flex-col gap-1", !collapsed && "ml-3 border-l pl-3")}>
                  {group.items.map((item) => (
                    <SidebarLink
                      key={item.href}
                      item={item}
                      active={pathname === item.href}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <SidebarLink
          item={NAV_CLIENTS}
          active={pathname === "/clientes"}
          collapsed={collapsed}
        />

        <SidebarLink
          item={NAV_ROUTES}
          active={pathname === "/rutas" || pathname.startsWith("/rutas/")}
          collapsed={collapsed}
        />

        <SidebarLink
          item={NAV_CONFIG}
          active={pathname === "/configuracion"}
          collapsed={collapsed}
        />
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/60",
          collapsed && "hidden",
        )}
      >
        Rutex · v0.1.0
      </div>
    </aside>
  )
}
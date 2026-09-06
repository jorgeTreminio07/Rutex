"use client"

import { ChevronDownIcon, LogOutIcon } from "lucide-react"

import { NotificationBell } from "@/components/layout/notification-bell"
import { UserAvatar } from "@/components/layout/user-avatar"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/features/auth/hooks/use-logout"
import { useAuthStore } from "@/features/auth/store/use-auth-store"

export function DesktopNavbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || ""

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-end gap-1 border-b bg-background px-6 md:flex">
      <ThemeToggle />

      <NotificationBell />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="h-12 gap-3 px-3 hover:bg-muted" />}
        >
          <UserAvatar user={user} size="lg" />
          <span className="flex flex-col items-start leading-none">
            <span className="text-sm font-medium">{user?.username}</span>
            {user?.email ? (
              <span className="mt-0.5 text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={logout}>
            <LogOutIcon />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
"use client"

import { LogOutIcon, MenuIcon } from "lucide-react"

import { StoreLogo } from "@/components/layout/store-logo"
import { NotificationBell } from "@/components/layout/notification-bell"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserAvatar } from "@/components/layout/user-avatar"
import { useStore } from "@/features/store/hooks/use-store"
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

interface MobileAppBarProps {
  onOpenNav: () => void
}

export function MobileAppBar({ onOpenNav }: MobileAppBarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { data: store } = useStore()
  const brandName = store?.name ?? "Rutex"

  return (
    <header className="sticky top-0 z-30 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
      <div className="flex h-14 items-center gap-2 px-2">
        <Button variant="ghost" size="icon" onClick={onOpenNav} aria-label="Abrir menú">
          <MenuIcon />
        </Button>
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <StoreLogo size="sm" />
          <span className="truncate">{brandName}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="rounded-full" />}
              aria-label="Opciones de usuario"
            >
              <UserAvatar user={user} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOutIcon />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
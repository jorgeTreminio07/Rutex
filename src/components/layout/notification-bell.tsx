"use client"

import { BellIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationBell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full md:size-12"
            aria-label="Notificaciones"
          />
        }
      >
        <BellIcon className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <div className="p-4 text-center text-sm text-muted-foreground">
          Sin notificaciones por el momento
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
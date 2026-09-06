"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAssetUrl } from "@/lib/assets"
import type { AuthUser } from "@/types/interfaces/auth.interface"

interface UserAvatarProps {
  user?: Pick<AuthUser, "username" | "imageUrl"> | null
  size?: "sm" | "default" | "lg"
  className?: string
}

export function UserAvatar({ user, size = "default", className }: UserAvatarProps) {
  const src = getAssetUrl(user?.imageUrl)
  const initials = user?.username?.trim().slice(0, 2).toUpperCase() ?? "??"

  return (
    <Avatar size={size} className={className}>
      {src && <AvatarImage src={src} alt={user?.username ?? "Usuario"} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
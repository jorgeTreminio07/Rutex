"use client"

import { ShieldXIcon } from "lucide-react"
import type { ReactNode } from "react"

import { usePermissions } from "@/features/auth/hooks/use-permissions"

export function NoPermission({
  message = "No tienes permiso para ver esta sección.",
}: {
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border py-16 text-center">
      <ShieldXIcon className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface PermissionGateProps {
  moduleKey?: string
  perm?: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({
  moduleKey,
  perm,
  children,
  fallback,
}: PermissionGateProps) {
  const { canView, has } = usePermissions()
  const allowed = perm ? has(perm) : moduleKey ? canView(moduleKey) : true

  if (!allowed) {
    return <>{fallback ?? <NoPermission />}</>
  }

  return <>{children}</>
}
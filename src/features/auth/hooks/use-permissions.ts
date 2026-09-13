"use client"

import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { hasPermission, viewPermission } from "@/lib/permissions"

export function usePermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])

  return {
    permissions,
    has: (permission: string) => hasPermission(permissions, permission),
    hasAny: (allowed: string[]) => allowed.some((p) => hasPermission(permissions, p)),
    canView: (moduleKey: string) => hasPermission(permissions, viewPermission(moduleKey)),
  }
}
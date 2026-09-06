"use client"

import Link from "next/link"
import { ArrowRightIcon, ShieldCheckIcon, UsersIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { useUsers } from "@/features/users/hooks/use-users"

export function HomeView() {
  const user = useAuthStore((s) => s.user)
  const usersQuery = useUsers()
  const rolesQuery = useRoles()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Hola, {user?.username}</h1>
        <p className="text-sm text-muted-foreground">
          Este es tu panel de gestión de la tienda.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/usuarios" className="group">
          <Card className="transition-colors group-hover:border-primary/40">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UsersIcon className="size-5" />
              </div>
              <CardTitle className="mt-2 flex items-center gap-1.5">
                Usuarios
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {usersQuery.isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${usersQuery.data?.length ?? 0} usuarios registrados`
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/usuarios/roles" className="group">
          <Card className="transition-colors group-hover:border-primary/40">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <CardTitle className="mt-2 flex items-center gap-1.5">
                Roles
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {rolesQuery.isLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${rolesQuery.data?.length ?? 0} roles registrados`
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
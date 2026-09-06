"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/features/auth/hooks/use-login"
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/validations/login.schema"

export function LoginForm() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-xs">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ingresa tus credenciales para acceder
        </p>
      </div>

      <form onSubmit={handleSubmit((values) => login.mutate(values))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
            Correo
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register("email")}
            placeholder="tu@email.com"
            className="h-10 rounded-xl px-3.5 text-sm"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              className="h-10 rounded-xl pr-10 text-sm"
              {...register("password")}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="mt-2 h-10 w-full rounded-xl text-sm font-medium cursor-pointer"
          disabled={login.isPending}
        >
          {login.isPending && <Loader2 className="animate-spin" />}
          Iniciar Sesión
        </Button>
      </form>
    </div>
  )
}
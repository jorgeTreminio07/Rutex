import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { loginRequest, type LoginPayload } from "@/features/auth/api/auth.api"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { getApiErrorMessage } from "@/lib/api-client"

export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const mutation = useMutation({
    mutationFn: (values: LoginPayload) => loginRequest(values),
    onSuccess: (user) => {
      setUser(user)
      queueMicrotask(() => {
        router.replace("/")
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Usuario o contraseña incorrectos"), {
        duration: 3000,
        position: "top-right",
        style: { background: "var(--destructive)", color: "var(--primary-foreground)", width: "auto" },
      })
    },
  })

  return mutation
}
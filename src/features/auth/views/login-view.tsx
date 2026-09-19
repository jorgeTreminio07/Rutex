import { StoreIcon } from "lucide-react"
import Image from "next/image"

import { LoginForm } from "@/features/auth/components/login-form"

interface LoginViewProps {
  storeName?: string
  storeLogoUrl?: string | null
}

export function LoginView({ storeName = "Rutex", storeLogoUrl = null }: LoginViewProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      <div className="absolute inset-0 bg-muted" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_60%)] opacity-20" />
      <div className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl ring-1 ring-foreground/10 shadow-lg shadow-foreground/5 max-md:flex-col md:h-[520px]">
        <div className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-primary md:flex">
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-24 -right-16 size-72 rounded-full bg-primary-foreground/10" />
          {storeLogoUrl ? (
            <Image
              src={storeLogoUrl}
              alt={`Logo de ${storeName}`}
              width={112}
              height={112}
              unoptimized
              className="relative size-28 rounded-2xl object-cover ring-1 ring-primary-foreground/25 shadow-lg"
            />
          ) : (
            <StoreIcon className="relative size-24 text-primary-foreground" strokeWidth={1.6} />
          )}
          <span className="relative mt-5 text-4xl font-semibold tracking-tight text-primary-foreground">
            {storeName}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-card px-6 py-10 max-md:px-5 max-md:py-8 sm:px-10">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground md:hidden">
            {storeLogoUrl ? (
              <Image
                src={storeLogoUrl}
                alt={`Logo de ${storeName}`}
                width={24}
                height={24}
                unoptimized
                className="size-6 rounded-md object-cover ring-1 ring-border"
              />
            ) : (
              <StoreIcon className="size-5 text-primary" />
            )}
            <span className="text-lg">{storeName}</span>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
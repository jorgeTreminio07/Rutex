"use client"

import { StoreIcon } from "lucide-react"
import Image from "next/image"

import { useStore } from "@/features/store/hooks/use-store"
import { getAssetUrl } from "@/lib/assets"
import { cn } from "@/lib/utils"

interface StoreLogoProps {
  size?: "sm" | "default" | "lg"
  className?: string
}

const SIZE_BOX: Record<NonNullable<StoreLogoProps["size"]>, string> = {
  sm: "size-7 rounded-lg",
  default: "size-9 rounded-xl",
  lg: "size-10 rounded-xl",
}

const SIZE_PX: Record<NonNullable<StoreLogoProps["size"]>, number> = {
  sm: 28,
  default: 36,
  lg: 40,
}

const SIZE_ICON: Record<NonNullable<StoreLogoProps["size"]>, string> = {
  sm: "size-4",
  default: "size-5",
  lg: "size-6",
}

export function StoreLogo({ size = "default", className }: StoreLogoProps) {
  const { data: store } = useStore()
  const logoUrl = store?.logoUrl ? getAssetUrl(store.logoUrl) : null
  const brandName = store?.name ?? "la tienda"

  if (!logoUrl) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
          SIZE_BOX[size],
          className,
        )}
      >
        <StoreIcon className={SIZE_ICON[size]} />
      </span>
    )
  }

  return (
    <Image
      src={logoUrl}
      alt={`Logo de ${brandName}`}
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      style={{ width: SIZE_PX[size], height: SIZE_PX[size] }}
      unoptimized
      className={cn("shrink-0 object-cover ring-1 ring-border", SIZE_BOX[size], className)}
    />
  )
}
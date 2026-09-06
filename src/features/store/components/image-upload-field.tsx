"use client"

import { ImageIcon, Trash2Icon, UploadCloud } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  id: string
  label: string
  hint: string
  accept?: string
  value?: File | null
  existingUrl?: string | null
  error?: string
  onSelect: (file: File) => void
  onRemove: () => void
}

export function ImageUploadField({
  id,
  label,
  hint,
  accept = "image/png",
  value,
  existingUrl,
  error,
  onSelect,
  onRemove,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  useEffect(() => {
    if (!value) return
    const objectUrl = URL.createObjectURL(value)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [value])

  const preview = removed ? null : value ? previewUrl : existingUrl
  const showRemove = Boolean(value || (existingUrl && !removed))

  const handleRemove = () => {
    setRemoved(true)
    onRemove()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
          {preview ? (
            <Image
              src={preview}
              alt={label}
              width={64}
              height={64}
              unoptimized
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <label
          htmlFor={id}
          className={cn(
            "flex flex-1 cursor-pointer flex-col rounded-xl border border-dashed p-3 text-sm transition-colors hover:bg-muted/50",
            error && "border-destructive",
          )}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <UploadCloud className="size-4" />
            Elegir imagen
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              setRemoved(false)
              onSelect(file)
            }
            event.target.value = ""
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-destructive hover:text-destructive"
          onClick={handleRemove}
        >
          <Trash2Icon />
          Quitar
        </Button>
      )}
    </div>
  )
}
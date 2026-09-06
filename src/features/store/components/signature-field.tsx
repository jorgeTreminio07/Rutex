"use client"

import { PenLine, Trash2Icon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { SignatureDialog } from "@/features/store/components/signature-dialog"

interface SignatureFieldProps {
  value?: File | null
  existingUrl?: string | null
  error?: string
  onSelect: (file: File) => void
  onRemove: () => void
}

export function SignatureField({ value, existingUrl, error, onSelect, onRemove }: SignatureFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [drawOpen, setDrawOpen] = useState(false)

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
      <Label>Firma</Label>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
          {preview ? (
            <Image
              src={preview}
              alt="Firma"
              width={64}
              height={64}
              unoptimized
              className="size-full object-contain"
            />
          ) : (
            <PenLine className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <label
            htmlFor="store-signature-upload"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "cursor-pointer")}
          >
            Subir PNG
          </label>
          <input
            id="store-signature-upload"
            type="file"
            accept="image/png"
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
          <Button type="button" variant="outline" size="sm" onClick={() => setDrawOpen(true)}>
            <PenLine />
            Dibujar firma
          </Button>
        </div>
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

      <SignatureDialog
        open={drawOpen}
        onOpenChange={setDrawOpen}
        onConfirm={(file) => {
          setRemoved(false)
          onSelect(file)
          setDrawOpen(false)
        }}
      />
    </div>
  )
}
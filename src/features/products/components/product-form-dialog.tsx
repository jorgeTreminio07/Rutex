"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronsUpDownIcon, ImageIcon, Loader2Icon, ScanBarcodeIcon, UploadCloudIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { ReactNode } from "react"
import { z } from "zod"

import { BarcodeScannerDialog } from "@/components/barcode/barcode-scanner-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadProductImageRequest } from "@/features/products/api/products.api"
import {
  productSchema,
  type ProductFormData,
} from "@/features/products/validations/product.schema"
import type { ProductDto } from "@/types/interfaces/product.interface"

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductDto | null
  isPending: boolean
  categories?: string[]
  onSubmit: (values: ProductFormData) => Promise<void>
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function CategoryField({
  value,
  onChange,
  categories,
}: {
  value: string
  onChange: (value: string) => void
  categories: string[]
}) {
  const [open, setOpen] = useState(false)
  const query = value.trim().toLowerCase()
  const matches = [...new Set(categories)]
    .filter((c) => c.toLowerCase().includes(query))
    .filter((c) => c.toLowerCase() !== query)
    .slice(0, 8)

  return (
    <div className="relative">
      <Input
        id="product-category"
        className="h-10 rounded-xl pr-9"
        placeholder="ej. Calzado, Electrónica"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      <ChevronsUpDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      {open && matches.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-md">
          {matches.map((category) => (
            <li key={category}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(category)
                  setOpen(false)
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  isPending,
  categories = [],
  onSubmit,
}: ProductFormDialogProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  const form = useForm<z.input<typeof productSchema>, unknown, z.output<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      barcode: product?.barcode ?? "",
      purchasePrice: product?.purchasePrice != null ? String(product.purchasePrice) : "",
      price: product?.price != null ? String(product.price) : "",
      discountPercent: product?.discountPercent != null ? String(product.discountPercent) : "",
      category: product?.category ?? "",
      images: product?.images ?? [],
    },
  })

  const images = useWatch({ control: form.control, name: "images" }) ?? []
  const productName = useWatch({ control: form.control, name: "name" })
  const category = useWatch({ control: form.control, name: "category" }) ?? ""
  const barcode = useWatch({ control: form.control, name: "barcode" }) ?? ""

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      form.setValue("images", [...images, imageUrl.trim()])
      setImageUrl("")
    }
  }

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    setIsUploading(true)
    try {
      const { url } = await uploadProductImageRequest(file, productName.trim() || "producto")
      form.setValue("images", [...images, url])
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    form.setValue("images", images.filter((_, i) => i !== index))
  }

  const handleBarcodeScan = (barcode: string) => {
    form.setValue("barcode", barcode)
    setScannerOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            {product ? "Actualiza los datos del producto." : "Registra un producto nuevo en el catálogo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Nombre *" htmlFor="product-name" error={form.formState.errors.name?.message}>
            <Input
              id="product-name"
              className="h-10 rounded-xl"
              placeholder="ej. Tenis Deportivos"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
          </Field>

          <Field label="Categoría *" htmlFor="product-category" error={form.formState.errors.category?.message}>
            <CategoryField
              value={category}
              onChange={(v) => form.setValue("category", v)}
              categories={categories}
            />
            <p className="text-xs text-muted-foreground">Elige una existente o escribe una nueva.</p>
          </Field>

          <Field label="Código de barras" htmlFor="product-barcode" error={form.formState.errors.barcode?.message}>
            {barcode ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 flex-1 items-center overflow-hidden rounded-xl border bg-muted/50 px-3 font-mono text-sm">
                  {barcode}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl px-3"
                  onClick={() => setScannerOpen(true)}
                  aria-label="Re-escanear código de barras"
                >
                  <ScanBarcodeIcon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-10 rounded-xl px-0"
                  onClick={() => form.setValue("barcode", "")}
                  aria-label="Quitar código de barras"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-10 justify-start rounded-xl"
                onClick={() => setScannerOpen(true)}
              >
                <ScanBarcodeIcon className="size-4" />
                Escanear código de barras
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Opcional. Escanea el código del producto con la cámara.</p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio compra (C$)" htmlFor="product-purchase-price" error={form.formState.errors.purchasePrice?.message}>
              <Input
                id="product-purchase-price"
                type="number"
                step="0.01"
                min="0"
                className="h-10 rounded-xl"
                placeholder="0.00"
                aria-invalid={!!form.formState.errors.purchasePrice?.message}
                {...form.register("purchasePrice")}
              />
            </Field>

            <Field label="Precio venta (C$)" htmlFor="product-price" error={form.formState.errors.price?.message}>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                className="h-10 rounded-xl"
                aria-invalid={!!form.formState.errors.price?.message}
                {...form.register("price")}
              />
            </Field>

            <Field label="% Descuento" htmlFor="product-discount" error={form.formState.errors.discountPercent?.message}>
              <Input
                id="product-discount"
                type="number"
                min="0"
                max="100"
                className="h-10 rounded-xl"
                {...form.register("discountPercent")}
              />
            </Field>
          </div>

          <Field label="Descripción" htmlFor="product-description" error={form.formState.errors.description?.message}>
            <Textarea
              id="product-description"
              placeholder="Describe las características del producto..."
              aria-invalid={!!form.formState.errors.description?.message}
              {...form.register("description")}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Label>Imágenes</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="…o pega una URL de imagen"
                className="h-10 rounded-xl flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddImage} disabled={isUploading}>
                Agregar
              </Button>
            </div>
            <label
              htmlFor="product-image-file"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              {isUploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadCloudIcon className="size-4" />}
              {isUploading ? "Subiendo…" : "Subir foto"}
              <input
                id="product-image-file"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  e.target.value = ""
                }}
              />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    {url ? (
                      <Image src={url} alt={`Preview ${idx + 1}`} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <BarcodeScannerDialog
      open={scannerOpen}
      onOpenChange={setScannerOpen}
      onScan={handleBarcodeScan}
    />
    </>
  )
}

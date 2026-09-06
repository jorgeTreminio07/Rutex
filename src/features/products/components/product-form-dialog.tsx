"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon, Loader2Icon, UploadCloudIcon } from "lucide-react"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { ReactNode } from "react"

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

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  isPending,
  onSubmit,
}: ProductFormDialogProps) {
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      purchasePrice: product?.purchasePrice ?? 0,
      price: product?.price ?? 0,
      discountPercent: product?.discountPercent ?? 0,
      category: product?.category ?? "",
      stock: product?.stock ?? 0,
      images: product?.images ?? [],
    },
  })

  const images = useWatch({ control: form.control, name: "images" }) ?? []
  const productName = useWatch({ control: form.control, name: "name" })

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

  return (
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
            <Input
              id="product-category"
              className="h-10 rounded-xl"
              placeholder="ej. Calzado, Electrónica"
              aria-invalid={!!form.formState.errors.category}
              {...form.register("category")}
            />
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
                {...form.register("purchasePrice", { valueAsNumber: true })}
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
                {...form.register("price", { valueAsNumber: true })}
              />
            </Field>

            <Field label="% Descuento" htmlFor="product-discount" error={form.formState.errors.discountPercent?.message}>
              <Input
                id="product-discount"
                type="number"
                min="0"
                max="100"
                className="h-10 rounded-xl"
                {...form.register("discountPercent", { valueAsNumber: true })}
              />
            </Field>

            <Field label="Stock *" htmlFor="product-stock" error={form.formState.errors.stock?.message}>
              <Input
                id="product-stock"
                type="number"
                min="0"
                className="h-10 rounded-xl"
                aria-invalid={!!form.formState.errors.stock?.message}
                {...form.register("stock", { valueAsNumber: true })}
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
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
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
  )
}

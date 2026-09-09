"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductDeleteDialog } from "@/features/products/components/product-delete-dialog"
import { ProductFormDialog } from "@/features/products/components/product-form-dialog"
import { ProductsMobileList } from "@/features/products/components/products-mobile-list"
import { ProductsTable } from "@/features/products/components/products-table"
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/features/products/hooks/use-products"
import type { ProductFormData } from "@/features/products/validations/product.schema"
import type { ProductDto } from "@/types/interfaces/product.interface"

export function ProductsView() {
  const { data: products = [], isLoading } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductDto | null>(null)
  const [deleting, setDeleting] = useState<ProductDto | null>(null)
  const [formKey, setFormKey] = useState(0)

  const handleCreate = async (values: ProductFormData) => {
    await createProduct.mutateAsync(values)
    setFormOpen(false)
  }

  const handleUpdate = async (values: ProductFormData) => {
    if (!editing) return
    await updateProduct.mutateAsync({ id: editing.id, payload: values })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  const openEdit = (product: ProductDto) => {
    setEditing(product)
    setFormOpen(true)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los productos de la tienda.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nuevo producto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <ProductsTable products={products} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <ProductsMobileList products={products} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        </>
      )}

      <ProductFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        isPending={createProduct.isPending || updateProduct.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ProductDeleteDialog
        product={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteProduct.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteProduct.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}

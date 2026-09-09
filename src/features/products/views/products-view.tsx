"use client"

import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("todas")

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]
    .map((c) => c.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))

  const filtered = products.filter((product) => {
    const matchesName = product.name.toLowerCase().includes(search.trim().toLowerCase())
    const matchesCategory = categoryFilter === "todas" || product.category === categoryFilter
    return matchesName && matchesCategory
  })

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "todas")}>
          <SelectTrigger className="w-48 h-10 rounded-xl">
            <FilterIcon className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">
              <SelectItemText>Todas las categorías</SelectItemText>
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                <SelectItemText>{category}</SelectItemText>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <ProductsTable products={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <ProductsMobileList products={filtered} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        </>
      )}

      <ProductFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        isPending={createProduct.isPending || updateProduct.isPending}
        categories={categories}
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

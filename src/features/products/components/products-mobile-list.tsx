"use client"

import { PencilIcon, Trash2Icon, PackageIcon } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { ProductDto } from "@/types/interfaces/product.interface"

const PAGE_SIZE = 10

interface ProductsMobileListProps {
  products: ProductDto[]
  onEdit: (product: ProductDto) => void
  onDelete: (product: ProductDto) => void
}

export function ProductsMobileList({ products, onEdit, onDelete }: ProductsMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(products, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((product) => {
          const hasDiscount = product.discountPercent > 0
          const finalPrice = hasDiscount
            ? product.price * (1 - product.discountPercent / 100)
            : product.price

          return (
            <li key={product.id}>
              <Card className="flex flex-row items-center gap-3 p-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <PackageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                  <div className="flex items-center gap-1">
                      {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          C$ {product.price.toFixed(2)}
                        </span>
                      )}
                      <span className={`text-sm font-semibold ${hasDiscount ? "text-destructive" : ""}`}>
                        C$ {finalPrice.toFixed(2)}
                      </span>
                    </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(product)}
                    aria-label={`Editar producto ${product.name}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(product)}
                    aria-label={`Eliminar producto ${product.name}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay productos registrados.
          </li>
        )}
      </ul>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}

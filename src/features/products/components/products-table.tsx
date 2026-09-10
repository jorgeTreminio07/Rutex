"use client"

import { PencilIcon, Trash2Icon, PackageIcon } from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { ProductDto } from "@/types/interfaces/product.interface"

const PAGE_SIZE = 10

interface ProductsTableProps {
  products: ProductDto[]
  onEdit: (product: ProductDto) => void
  onDelete: (product: ProductDto) => void
}

export function ProductsTable({ products, onEdit, onDelete }: ProductsTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(products, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((product) => {
            const hasDiscount = product.discountPercent > 0
            const finalPrice = hasDiscount
              ? product.price * (1 - product.discountPercent / 100)
              : product.price

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <PackageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      {hasDiscount && (
                        <Badge variant="destructive" className="mt-0.5 text-[10px]">
                          -{product.discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        C$ {product.price.toFixed(2)}
                      </span>
                    )}
                    <span className={`font-semibold ${hasDiscount ? "text-destructive" : ""}`}>
                      C$ {finalPrice.toFixed(2)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={product.stock <= 0 ? "destructive" : product.stock <= 5 ? "secondary" : "default"}>
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
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
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay productos registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}

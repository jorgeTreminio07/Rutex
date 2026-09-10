"use client"

import { useMemo } from "react"

import { buildReceiptBlocks } from "@/features/printing/lib/receipt"
import type { OrderDto } from "@/types/interfaces/order.interface"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"
import { cn } from "@/lib/utils"

interface ReceiptPrintViewProps {
  store: StoreProfileDto | null | undefined
  order: OrderDto
}

export function ReceiptPrintView({ store, order }: ReceiptPrintViewProps) {
  const blocks = useMemo(() => buildReceiptBlocks(store ?? {}, order), [store, order])

  return (
    <div className="overflow-x-auto rounded-xl bg-muted/50 p-4">
      <div
        className="mx-auto bg-white px-3 py-4 font-mono text-[9.5px] tabular-nums leading-[1.35] text-neutral-900 shadow-sm"
        style={{ width: "80mm" }}
        aria-label="Vista previa del recibo"
      >
        {blocks.map((block, index) => (
          <div
            key={index}
            className={cn(
              "whitespace-pre",
              block.align === "center" && "text-center",
              block.align === "right" && "text-right",
              block.bold && "font-bold",
              block.double && "text-[12px] font-extrabold",
            )}
          >
            {block.text}
          </div>
        ))}
      </div>
    </div>
  )
}
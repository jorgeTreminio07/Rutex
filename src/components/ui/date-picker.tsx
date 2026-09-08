"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function fmt(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function parse(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Seleccionar fecha", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<Date>(() => startOfMonth(parse(value) ?? new Date()))

  const selected = parse(value)
  const today = new Date()

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = React.useMemo(() => {
    const result: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d))
    while (result.length % 7 !== 0) result.push(null)
    while (result.length < 42) result.push(null)
    return result
  }, [year, month, firstWeekday, daysInMonth])

  const handleSelect = (date: Date) => {
    onChange(fmt(date))
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setView(startOfMonth(parse(value) ?? new Date()))
    }
  }

  const headerLabel = `${MONTHS[month]} ${year}`

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              className,
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("whitespace-nowrap", !value && "text-muted-foreground")}>
              {value && selected ? selected.toLocaleDateString("es-NI") : placeholder}
            </span>
          </button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-50 isolate outline-none">
          <Popover.Popup className="w-72 origin-(--transform-origin) rounded-xl bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setView(new Date(year, month - 1, 1))}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Mes anterior"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-sm font-bold">{headerLabel}</span>
              <button
                type="button"
                onClick={() => setView(new Date(year, month + 1, 1))}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Mes siguiente"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1 text-[11px] font-semibold text-muted-foreground">
                  {w}
                </span>
              ))}
              {cells.map((cell, i) => {
                if (!cell) {
                  return <span key={`empty-${i}`} className="size-9" />
                }
                const cellFmt = fmt(cell)
                const isSelected = cellFmt === value
                const isToday = cellFmt === fmt(today)
                return (
                  <button
                    key={cellFmt}
                    type="button"
                    onClick={() => handleSelect(cell)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary font-bold text-primary-foreground"
                        : isToday
                          ? "font-semibold text-primary ring-1 ring-primary/40 ring-inset hover:bg-primary/10"
                          : "text-foreground hover:bg-muted",
                    )}
                  >
                    {cell.getDate()}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t pt-2">
              <button
                type="button"
                onClick={() => handleSelect(new Date())}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                Hoy
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("")
                    setOpen(false)
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Limpiar
                </button>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
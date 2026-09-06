export const STATUSES = {
  ACTIVE: 1,
  INACTIVE: 2,
  BLOCKED: 3,
  DELETED: 4,
} as const

export interface StatusMeta {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
}

export const STATUS_META: Record<number, StatusMeta> = {
  [STATUSES.ACTIVE]: { label: "Activo", variant: "default" },
  [STATUSES.INACTIVE]: { label: "Inactivo", variant: "secondary" },
  [STATUSES.BLOCKED]: { label: "Bloqueado", variant: "destructive" },
  [STATUSES.DELETED]: { label: "Eliminado", variant: "outline" },
}

export function getStatusMeta(statusId: number): StatusMeta {
  return STATUS_META[statusId] ?? { label: "Desconocido", variant: "outline" }
}
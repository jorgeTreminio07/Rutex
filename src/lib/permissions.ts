export interface PermissionAction {
  key: string
  label: string
}

export interface PermissionModule {
  key: string
  label: string
  actions: PermissionAction[]
}

const CRUD_ACTIONS: PermissionAction[] = [
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
]

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: "dashboard", label: "Inicio", actions: [] },
  { key: "productos", label: "Productos", actions: CRUD_ACTIONS },
  { key: "inventarios", label: "Inventarios", actions: CRUD_ACTIONS.slice(0, 2) },
  { key: "catalogo", label: "Catálogo", actions: [] },
  {
    key: "pedidos",
    label: "Pedidos",
    actions: [
      { key: "crear", label: "Crear" },
      { key: "aprobar", label: "Aprobar" },
      { key: "rechazar", label: "Rechazar" },
      { key: "eliminar", label: "Eliminar" },
      { key: "notificar", label: "Notificar" },
    ],
  },
  {
    key: "almacen",
    label: "Almacén / Entregas",
    actions: [{ key: "avanzar", label: "Avanzar estado" }],
  },
  { key: "cartera", label: "Cartera", actions: [{ key: "abonar", label: "Registrar abono" }] },
  { key: "mermas", label: "Mermas", actions: CRUD_ACTIONS },
  {
    key: "rutas",
    label: "Rutas",
    actions: [
      { key: "crear", label: "Crear" },
      { key: "actualizar", label: "Actualizar clientes" },
      { key: "cancelar", label: "Cancelar ruta" },
      { key: "eliminar", label: "Eliminar" },
    ],
  },
  { key: "clientes", label: "Clientes", actions: CRUD_ACTIONS },
  { key: "proveedores", label: "Proveedores", actions: CRUD_ACTIONS },
  { key: "gastos", label: "Gastos", actions: CRUD_ACTIONS },
  { key: "compras", label: "Compras", actions: CRUD_ACTIONS },
  { key: "reportes", label: "Reportes", actions: [] },
  { key: "usuarios", label: "Usuarios", actions: CRUD_ACTIONS },
  { key: "roles", label: "Roles", actions: CRUD_ACTIONS },
  { key: "configuracion", label: "Configuración", actions: [CRUD_ACTIONS[1]] },
]

export const PERMISSION_MODULES_BY_KEY: Record<string, PermissionModule> =
  Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, m]))

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_MODULES.flatMap((m) => [
  `${m.key}:ver`,
  ...m.actions.map((a) => `${m.key}:${a.key}`),
])

export function viewPermission(moduleKey: string): string {
  return `${moduleKey}:ver`
}

export function modulePermissions(moduleKey: string): string[] {
  const mod = PERMISSION_MODULES_BY_KEY[moduleKey]
  if (!mod) return []
  return [`${moduleKey}:ver`, ...mod.actions.map((a) => `${moduleKey}:${a.key}`)]
}

export function isValidPermission(key: string): boolean {
  return ALL_PERMISSION_KEYS.includes(key)
}

export function normalizePermissions(perms: unknown): string[] {
  if (!Array.isArray(perms)) return []
  return [...new Set(perms.filter((p): p is string => typeof p === "string" && isValidPermission(p)))]
}

export function hasPermission(perms: string[] | undefined, permission: string): boolean {
  return Boolean(perms?.includes(permission))
}

export function isAdminRoleName(name: string | null | undefined): boolean {
  return (name ?? "").toLowerCase().replace(/[^a-z]/g, "") === "admin"
}
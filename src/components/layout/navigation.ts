import {
  ClipboardListIcon,
  HomeIcon,
  PackageIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_HOME: NavItem = { label: "Inicio", href: "/", icon: HomeIcon }
export const NAV_INVENTORY: NavItem = { label: "Inventario", href: "/inventario", icon: PackageIcon }
export const NAV_ORDERS: NavItem = { label: "Pedidos", href: "/pedidos", icon: ClipboardListIcon }
export const NAV_CATALOG: NavItem = { label: "Catálogo", href: "/catalogo", icon: ShoppingBagIcon }
export const NAV_USERS: NavItem = { label: "Usuarios", href: "/usuarios", icon: UsersIcon }
export const NAV_ROLES: NavItem = { label: "Roles", href: "/usuarios/roles", icon: ShieldCheckIcon }
export const NAV_CONFIG: NavItem = { label: "Configuración", href: "/configuracion", icon: SettingsIcon }

export const PRIMARY_TABS: NavItem[] = [NAV_HOME, NAV_INVENTORY, NAV_ORDERS, NAV_CATALOG, NAV_CONFIG]

export const MOBILE_TABS: NavItem[] = [NAV_HOME, NAV_CONFIG, NAV_USERS]

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "Tienda",
    icon: ShoppingBagIcon,
    items: [NAV_INVENTORY, NAV_ORDERS, NAV_CATALOG],
  },
  {
    label: "Usuarios",
    icon: UsersIcon,
    items: [NAV_USERS, NAV_ROLES],
  },
]
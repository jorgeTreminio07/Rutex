import {
  BoxesIcon,
  ClipboardListIcon,
  ContactRoundIcon,
  FactoryIcon,
  HandCoinsIcon,
  HomeIcon,
  MapIcon,
  PackageIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
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
export const NAV_PRODUCTS: NavItem = { label: "Productos", href: "/productos", icon: PackageIcon }
export const NAV_INVENTORIES: NavItem = { label: "Inventarios", href: "/inventarios", icon: BoxesIcon }
export const NAV_ORDERS: NavItem = { label: "Pedidos", href: "/pedidos", icon: ClipboardListIcon }
export const NAV_DELIVERIES: NavItem = { label: "Almacén", href: "/almacen", icon: TruckIcon }
export const NAV_CARTERA: NavItem = { label: "Cartera", href: "/cartera", icon: HandCoinsIcon }
export const NAV_CATALOG: NavItem = { label: "Catálogo", href: "/catalogo", icon: ShoppingBagIcon }
export const NAV_SUPPLIERS: NavItem = { label: "Proveedores", href: "/proveedores", icon: FactoryIcon }
export const NAV_CLIENTS: NavItem     = { label: "Clientes",     href: "/clientes",     icon: ContactRoundIcon }
export const NAV_ROUTES: NavItem      = { label: "Rutas",        href: "/rutas",        icon: MapIcon }
export const NAV_USERS: NavItem = { label: "Usuarios", href: "/usuarios", icon: UsersIcon }
export const NAV_ROLES: NavItem = { label: "Roles", href: "/usuarios/roles", icon: ShieldCheckIcon }
export const NAV_CONFIG: NavItem = { label: "Configuración", href: "/configuracion", icon: SettingsIcon }

export const PRIMARY_TABS: NavItem[] = [NAV_HOME, NAV_PRODUCTS, NAV_ORDERS, NAV_CATALOG, NAV_CONFIG]

export const MOBILE_TABS: NavItem[] = [NAV_HOME, NAV_CONFIG, NAV_USERS]

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "Tienda",
    icon: ShoppingBagIcon,
    items: [NAV_PRODUCTS, NAV_INVENTORIES, NAV_CATALOG, NAV_ORDERS, NAV_DELIVERIES, NAV_CARTERA],
  },
  {
    label: "Usuarios",
    icon: UsersIcon,
    items: [NAV_USERS, NAV_ROLES],
  },
]

import {
  BarChart3Icon,
  BoxesIcon,
  ClipboardListIcon,
  ContactRoundIcon,
  FactoryIcon,
  HandCoinsIcon,
  HomeIcon,
  MapIcon,
  PackageCheckIcon,
  PackageIcon,
  PackageMinusIcon,
  ReceiptTextIcon,
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
  perm: string
}

export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const NAV_HOME: NavItem = { label: "Inicio", href: "/", icon: HomeIcon, perm: "dashboard" }
export const NAV_PRODUCTS: NavItem = { label: "Productos", href: "/productos", icon: PackageIcon, perm: "productos" }
export const NAV_INVENTORIES: NavItem = { label: "Inventarios", href: "/inventarios", icon: BoxesIcon, perm: "inventarios" }
export const NAV_ORDERS: NavItem = { label: "Pedidos", href: "/pedidos", icon: ClipboardListIcon, perm: "pedidos" }
export const NAV_DELIVERIES: NavItem = { label: "Almacén", href: "/almacen", icon: TruckIcon, perm: "almacen" }
export const NAV_CARTERA: NavItem = { label: "Cartera", href: "/cartera", icon: HandCoinsIcon, perm: "cartera" }
export const NAV_MERMAS: NavItem = { label: "Mermas", href: "/mermas", icon: PackageMinusIcon, perm: "mermas" }
export const NAV_CATALOG: NavItem = { label: "Catálogo", href: "/catalogo", icon: ShoppingBagIcon, perm: "catalogo" }
export const NAV_SUPPLIERS: NavItem = { label: "Proveedores", href: "/proveedores", icon: FactoryIcon, perm: "proveedores" }
export const NAV_CLIENTS: NavItem     = { label: "Clientes",     href: "/clientes",     icon: ContactRoundIcon, perm: "clientes" }
export const NAV_ROUTES: NavItem      = { label: "Rutas",        href: "/rutas",        icon: MapIcon, perm: "rutas" }
export const NAV_GASTOS: NavItem      = { label: "Gastos",       href: "/gastos",       icon: ReceiptTextIcon, perm: "gastos" }
export const NAV_COMPRAS: NavItem     = { label: "Compras",      href: "/compras",      icon: PackageCheckIcon, perm: "compras" }
export const NAV_REPORTS: NavItem     = { label: "Reportes",      href: "/reportes",     icon: BarChart3Icon, perm: "reportes" }
export const NAV_USERS: NavItem = { label: "Usuarios", href: "/usuarios", icon: UsersIcon, perm: "usuarios" }
export const NAV_ROLES: NavItem = { label: "Roles", href: "/usuarios/roles", icon: ShieldCheckIcon, perm: "roles" }
export const NAV_CONFIG: NavItem = { label: "Configuración", href: "/configuracion", icon: SettingsIcon, perm: "configuracion" }

export const PRIMARY_TABS: NavItem[] = [NAV_HOME, NAV_PRODUCTS, NAV_ORDERS, NAV_CATALOG, NAV_CONFIG]

export const MOBILE_TABS: NavItem[] = [NAV_HOME, NAV_CONFIG, NAV_USERS]

export const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "Tienda",
    icon: ShoppingBagIcon,
    items: [NAV_PRODUCTS, NAV_INVENTORIES, NAV_CATALOG, NAV_ORDERS, NAV_DELIVERIES, NAV_CARTERA, NAV_MERMAS],
  },
  {
    label: "Usuarios",
    icon: UsersIcon,
    items: [NAV_USERS, NAV_ROLES],
  },
]

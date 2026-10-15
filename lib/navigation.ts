import {
  Home,
  Package,
  Scale,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  BarChart2,
  Tag,
  Settings,
  UserCircle,
  type LucideIcon,
} from "lucide-react"
import type { Resource, Action } from "@/lib/api"

// ─── Fuente única de ítems de navegación del Restaurant Tenant Workspace ────
// La consumen Sidebar (desktop) y MobileTabBar (móvil). NUNCA contiene ítems
// de Platform Console.

export interface NavItem {
  href: string
  label: string
  /** Etiqueta corta para espacios reducidos (barra inferior móvil) */
  shortLabel?: string
  icon: LucideIcon
  resource: Resource
  action: Action
  /** Feature key de membresía que gatea este módulo, si aplica (ver membership_features) */
  feature?: string
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      // El dashboard es visible para cualquier miembro de la organización
      { href: "/dashboard", label: "Inicio", icon: Home, resource: "organization", action: "read" },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/inventario", label: "Inventario", icon: Package, resource: "ingredients", action: "list", feature: "module_ingredients" },
      { href: "/recetas", label: "Recetas", icon: ChefHat, resource: "recipes", action: "list", feature: "module_recipes" },
      { href: "/menu", label: "Menú", icon: UtensilsCrossed, resource: "menus", action: "list", feature: "module_menus" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/valoracion", label: "Valoración A&B", shortLabel: "Valoración", icon: TrendingUp, resource: "valuations", action: "list", feature: "module_valuations" },
      { href: "/punto-equilibrio", label: "Punto de Equilibrio", shortLabel: "Equilibrio", icon: BarChart2, resource: "breakEven", action: "list", feature: "module_breakEven" },
      { href: "/factor-rendimiento", label: "Factor de Rendimiento", shortLabel: "Rendimiento", icon: Scale, resource: "yieldFactors", action: "list", feature: "module_yieldFactors" },
      { href: "/precios-mercado", label: "Precios de mercado", shortLabel: "Precios", icon: Tag, resource: "organization", action: "read", feature: "module_marketPrices" },
    ],
  },
]

/** Configuración: visible para quien gestiona el negocio o al menos ve el equipo */
export const CONFIG_ITEM = {
  href: "/configuracion",
  label: "Configuración",
  shortLabel: "Ajustes",
  icon: Settings,
} as const

export const ACCOUNT_ITEM = {
  href: "/cuenta",
  label: "Mi cuenta",
  shortLabel: "Cuenta",
  icon: UserCircle,
} as const

/** Destinos fijos en la barra inferior móvil, en orden de prioridad. El resto va en «Más». */
export const MOBILE_PRIMARY_HREFS = ["/dashboard", "/inventario", "/recetas", "/menu"] as const

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

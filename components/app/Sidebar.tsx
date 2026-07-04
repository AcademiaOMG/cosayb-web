"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Package,
  Scale,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  BarChart2,
  Settings,
  ShoppingCart,
  LogOut,
  UserCircle,
  X,
} from "lucide-react"
import type { Plan } from "@/types/domain"
import { usePermissions } from "@/hooks/usePermissions"
import type { Resource, Action } from "@/lib/api"

// ─── Navegación del Restaurant Tenant Workspace ──────────────────────────────
// Esta superficie NUNCA contiene ítems de Platform Console. El cruce entre
// superficies vive únicamente en el selector de contexto del Topbar.

interface NavItem {
  href: string
  label: string
  icon: typeof Package
  resource: Resource
  action: Action
}

interface NavGroup {
  label: string | null
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
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
      { href: "/inventario", label: "Inventario", icon: Package, resource: "ingredients", action: "list" },
      { href: "/precios-mercado", label: "Precios de Mercado", icon: ShoppingCart, resource: "marketPrices", action: "list" },
      { href: "/factor-rendimiento", label: "Factor de Rendimiento", icon: Scale, resource: "yieldFactors", action: "list" },
      { href: "/recetas", label: "Recetas", icon: ChefHat, resource: "recipes", action: "list" },
      { href: "/menu", label: "Menú", icon: UtensilsCrossed, resource: "menus", action: "list" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/valoracion", label: "Valoración A&B", icon: TrendingUp, resource: "valuations", action: "list" },
      { href: "/punto-equilibrio", label: "Punto de Equilibrio", icon: BarChart2, resource: "breakEven", action: "list" },
    ],
  },
]

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
  userPlan?: Plan
  onSignOut?: () => void
}

export default function Sidebar({
  isOpen,
  onClose,
  userName = "Usuario",
  userPlan = "free",
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname()
  const { can, isLoading } = usePermissions()

  // Grupos con solo los ítems permitidos; si un grupo queda vacío no se
  // renderiza (ni su etiqueta) — la estructura varía por rol, no se "esconde"
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: isLoading ? group.items : group.items.filter((i) => can(i.resource, i.action)),
  })).filter((group) => group.items.length > 0)

  // Configuración: visible para quien gestiona el negocio o al menos ve el equipo
  const showConfig = !isLoading && (can("organization", "update") || can("members", "list"))

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(18, 33, 58, 0.5)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 left-0 z-40 h-full w-60 flex flex-col transition-transform duration-200 lg:translate-x-0"
        style={{
          background: "var(--bg-inverse)",
          transform: isOpen ? "translateX(0)" : undefined,
        }}
        data-open={isOpen}
      >
        <style>{`
          @media (max-width: 1023px) {
            aside[data-open="false"] { transform: translateX(-100%); }
          }
        `}</style>

        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Link href="/dashboard" className="font-display text-2xl font-bold text-white">
            CO$AYB
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5"
            style={{ color: "rgba(255,255,255,0.5)" }}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll relative">
          {visibleGroups.map((group, gi) => (
            <div key={group.label ?? `g${gi}`} className={gi > 0 ? "mt-5" : ""}>
              {group.label && (
                <p
                  className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase"
                  style={{ color: "#5B6B85" }}
                >
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-1" role="list">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          background: isActive ? "var(--accent)" : "transparent",
                          color: isActive ? "#fff" : "#8FA0BC",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.background = "transparent"
                        }}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Configuración + cuenta + sesión */}
        <div
          className="px-3 py-3 flex flex-col gap-1 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {showConfig && (
            <Link
              href="/configuracion/equipo"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: pathname.startsWith("/configuracion") ? "var(--accent)" : "transparent",
                color: pathname.startsWith("/configuracion") ? "#fff" : "#8FA0BC",
              }}
            >
              <Settings size={18} />
              Configuración
            </Link>
          )}
          <Link
            href="/cuenta"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: pathname.startsWith("/cuenta") ? "var(--accent)" : "transparent",
              color: pathname.startsWith("/cuenta") ? "#fff" : "#8FA0BC",
            }}
          >
            <UserCircle size={18} />
            Mi cuenta
          </Link>
          {/* El nombre del usuario y el plan viven en el Topbar — aquí solo acciones */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
            style={{ color: "#8FA0BC", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

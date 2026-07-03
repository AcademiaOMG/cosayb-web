"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  Scale,
  ChefHat,
  UtensilsCrossed,
  TrendingUp,
  BarChart2,
  Settings,
  ShoppingCart,
  LogOut,
  X,
} from "lucide-react"
import PlanBadge from "./settings/PlanBadge"
import type { Plan } from "@/types/domain"
import { usePermissions } from "@/hooks/usePermissions"
import type { Resource, Action } from "@/lib/api"

interface NavItem {
  href: string
  label: string
  icon: typeof Package
  resource: Resource
  action: Action
}

const navItems: NavItem[] = [
  { href: "/inventario", label: "Inventario", icon: Package, resource: "ingredients", action: "list" },
  { href: "/precios-mercado", label: "Precios de Mercado", icon: ShoppingCart, resource: "marketPrices", action: "list" },
  { href: "/factor-rendimiento", label: "Factor de Rendimiento", icon: Scale, resource: "yieldFactors", action: "list" },
  { href: "/recetas", label: "Recetas", icon: ChefHat, resource: "recipes", action: "list" },
  { href: "/menu", label: "Menú", icon: UtensilsCrossed, resource: "menus", action: "list" },
  { href: "/valoracion", label: "Valoración A&B", icon: TrendingUp, resource: "valuations", action: "list" },
  { href: "/punto-equilibrio", label: "Punto de Equilibrio", icon: BarChart2, resource: "breakEven", action: "list" },
  { href: "/ajustes", label: "Ajustes", icon: Settings, resource: "organization", action: "read" },
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
  const { can, isLoading, isPlatform } = usePermissions()

  const visibleItems = isLoading
    ? navItems
    : navItems.filter((item) => can(item.resource, item.action))

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
          <span className="font-display text-2xl font-bold text-white">
            CO$AYB
          </span>
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
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1" role="list">
            {visibleItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: isActive
                        ? "var(--accent)"
                        : "transparent",
                      color: isActive ? "#fff" : "#8FA0BC",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)"
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
            {isPlatform && (
              <li key="/admin">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: pathname.startsWith("/admin") ? "var(--accent)" : "transparent",
                    color: pathname.startsWith("/admin") ? "#fff" : "#F0B429",
                  }}
                  aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                >
                  <Settings size={18} />
                  Plataforma
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* User section */}
        <div
          className="px-4 py-4 flex flex-col gap-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-medium truncate"
                style={{ color: "#E2E8F0" }}
              >
                {userName}
              </span>
              <PlanBadge plan={userPlan} />
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors w-full"
            style={{ color: "#8FA0BC" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import type { Plan } from "@/types/domain"
import { useNavItems } from "@/hooks/useNavItems"
import { ACCOUNT_ITEM, CONFIG_ITEM, SUPPORT_ITEM } from "@/lib/navigation"
import SidebarChecklist from "./SidebarChecklist"

// ─── Navegación del Restaurant Tenant Workspace ──────────────────────────────
// Solo existe en desktop (lg+). Los ítems vienen de lib/navigation.ts (fuente
// única compartida con MobileTabBar). NUNCA contiene ítems de Platform Console.

export interface SidebarProps {
  userPlan?: Plan
  onSignOut?: () => void
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const { groups: visibleGroups, showConfig } = useNavItems()

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 z-40 h-full w-60 flex-col"
      style={{ background: "var(--bg-inverse)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-5 h-16 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link href="/dashboard" className="font-display text-2xl font-bold text-white">
          ACADEMIA OMG
        </Link>
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

      {/* Primeros pasos: orden sugerido + progreso x/3, visible desde
          cualquier sección y oculto cuando el onboarding está completo. */}
      <SidebarChecklist />

      {/* Cuenta + sesión */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ul className="flex flex-col gap-1">
          {(
            [
              showConfig
                ? { type: "link" as const, href: CONFIG_ITEM.href, label: CONFIG_ITEM.label, icon: CONFIG_ITEM.icon }
                : null,
              { type: "link" as const, href: ACCOUNT_ITEM.href, label: ACCOUNT_ITEM.label, icon: ACCOUNT_ITEM.icon },
              { type: "link" as const, href: SUPPORT_ITEM.href, label: SUPPORT_ITEM.label, icon: SUPPORT_ITEM.icon },
              { type: "button" as const, label: "Cerrar sesión", icon: LogOut },
            ]
          )
            .filter((item): item is NonNullable<typeof item> => item != null)
            .map((item) => {
              const Icon = item.icon

              if (item.type === "link") {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
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
                        if (!isActive)
                          e.currentTarget.style.background = "transparent"
                      }}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                )
              }

              return (
                <li key={item.label}>
                  <button
                    onClick={onSignOut}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
                    style={{
                      background: "transparent",
                      color: "#8FA0BC",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              )
            })}
        </ul>
      </div>
    </aside>
  )
}

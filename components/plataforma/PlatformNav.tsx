"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { visibleGroups, isSectionActive } from "@/lib/plataforma/nav"

export interface PlatformNavProps {
  platformRoles: string[]
  /** Se llama al elegir una sección (el menú móvil se cierra con esto). */
  onNavigate?: () => void
}

/** Lista de secciones agrupadas por área, filtrada por rol. Compartida por la barra lateral y el menú móvil. */
export default function PlatformNav({ platformRoles, onNavigate }: PlatformNavProps) {
  const pathname = usePathname()
  const groups = visibleGroups(platformRoles)

  return (
    <nav aria-label="Secciones de la plataforma" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? "mt-5" : ""}>
          {/* El grupo «General» solo tiene el resumen: no necesita rótulo */}
          {group.label !== "General" && <p className="plat-nav-group">{group.label}</p>}
          <ul className="flex flex-col gap-1" role="list">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isSectionActive(pathname, href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="plat-nav-link"
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

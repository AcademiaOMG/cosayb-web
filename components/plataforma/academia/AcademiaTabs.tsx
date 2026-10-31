"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"

/** Pestañas de la sección Academia de la consola + acceso directo al LMS (donde se gestiona todo). */
export default function AcademiaTabs() {
  const pathname = usePathname()
  const { platformCan } = usePermissions()
  const tabs = [
    { href: "/plataforma/academia", label: "Datos", show: true },
    { href: "/plataforma/academia/usuarios", label: "Usuarios de Academia", show: platformCan("platform_lms_users", "list") },
  ].filter((t) => t.show)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b" style={{ borderColor: "var(--border-light)" }}>
      <nav aria-label="Secciones de Academia" className="flex flex-wrap gap-1">
        {tabs.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className="plat-focus -mb-px px-4 py-2.5 text-sm font-semibold"
              style={{ color: active ? "var(--accent)" : "var(--text-muted)", borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}` }}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
      <Link href="/administracion" className="plat-focus mb-1 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-semibold" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
        Abrir en el LMS <ExternalLink size={14} aria-hidden="true" />
      </Link>
    </div>
  )
}

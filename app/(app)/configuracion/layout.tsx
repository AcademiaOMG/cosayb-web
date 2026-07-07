"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import { usePermissions } from "@/hooks/usePermissions"
import { Users, Palette, CreditCard, ScrollText, ShieldCheck } from "lucide-react"

/**
 * Configuración del NEGOCIO — cada dominio es su propia ruta:
 *   /configuracion/equipo     miembros + invitaciones + límites
 *   /configuracion/marca      identidad del negocio
 *   /configuracion/membresia  plan, trial, features
 *
 * La sub-navegación se filtra por permisos: un manager ve solo Equipo
 * (lectura); Marca y Membresía son exclusivas de quien administra la org.
 */
export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { can, isLoading } = usePermissions()

  const sections = [
    {
      href: "/configuracion/equipo",
      label: "Equipo",
      icon: Users,
      visible: can("members", "list"),
    },
    {
      href: "/configuracion/marca",
      label: "Marca",
      icon: Palette,
      visible: can("organization", "update"),
    },
    {
      href: "/configuracion/membresia",
      label: "Membresía",
      icon: CreditCard,
      visible: can("billing", "read"),
    },
    {
      href: "/configuracion/actividad",
      label: "Actividad",
      icon: ScrollText,
      visible: can("organizationActivity", "read"),
    },
    {
      href: "/configuracion/roles",
      label: "Roles",
      icon: ShieldCheck,
      visible: can("organizationRoles", "list"),
    },
  ].filter((s) => isLoading || s.visible)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Configuración" subtitle="Administra tu negocio" />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sub-navegación lateral */}
        <nav
          className="flex lg:flex-col gap-1 shrink-0 lg:w-52 w-full overflow-x-auto"
          aria-label="Secciones de configuración"
        >
          {sections.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "transparent"}`,
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Contenido de la sección */}
        <div className="flex-1 min-w-0 w-full max-w-3xl">{children}</div>
      </div>
    </div>
  )
}

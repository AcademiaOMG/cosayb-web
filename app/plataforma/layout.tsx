"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/usePermissions"
import { clearSWRCache } from "@/components/SWRProvider"
import SessionGuard from "@/components/SessionGuard"
import { authClient } from "@/lib/auth"
import {
  Shield, BarChart3, Building2, Users, Drama, CreditCard,
  ChefHat, Carrot, ScrollText, LogOut, ShieldAlert,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════
// Platform Console — shell INDEPENDIENTE del Tenant Workspace (rutas y
// navegación propias por sub-rol), pero con el MISMO design system del
// proyecto (tokens CSS del tenant) para mantener coherencia visual.
// ═══════════════════════════════════════════════════════════════════════════

interface ConsoleSection {
  href: string
  label: string
  icon: typeof Shield
  roles: string[] // slugs platform_* que ven esta sección
}

const SECTIONS: ConsoleSection[] = [
  {
    href: "/plataforma",
    label: "Métricas",
    icon: BarChart3,
    roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
  },
  {
    href: "/plataforma/organizaciones",
    label: "Organizaciones",
    icon: Building2,
    roles: ["platform_owner", "platform_admin", "platform_support", "platform_billing", "platform_readonly"],
  },
  {
    href: "/plataforma/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["platform_owner", "platform_admin", "platform_support", "platform_readonly"],
  },
  {
    href: "/plataforma/roles",
    label: "Roles y permisos",
    icon: Drama,
    roles: ["platform_owner"],
  },
  {
    href: "/plataforma/membresias",
    label: "Membresías",
    icon: CreditCard,
    roles: ["platform_owner", "platform_admin", "platform_billing", "platform_readonly"],
  },
  {
    href: "/plataforma/banco/recetas",
    label: "Banco · Recetas",
    icon: ChefHat,
    roles: ["platform_owner", "platform_admin", "platform_chef"],
  },
  {
    href: "/plataforma/banco/ingredientes",
    label: "Banco · Ingredientes",
    icon: Carrot,
    roles: ["platform_owner", "platform_admin", "platform_chef"],
  },
  {
    href: "/plataforma/auditoria",
    label: "Auditoría",
    icon: ScrollText,
    roles: ["platform_owner", "platform_admin", "platform_auditor", "platform_readonly"],
  },
]

/** Primera sección visible para un conjunto de roles (landing de la consola) */
function firstSectionFor(roles: string[]): string {
  const section = SECTIONS.find((s) => s.roles.some((r) => roles.includes(r)))
  return section?.href ?? "/plataforma"
}

export default function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { platformRoles, isLoading } = usePermissions()
  const { data: session } = authClient.useSession()

  const visibleSections = SECTIONS.filter((s) =>
    s.roles.some((r) => platformRoles.includes(r))
  )

  // Landing por sub-rol: si la ruta actual no le corresponde (ej. platform_chef
  // puro entrando a /plataforma), llevarlo a su primera sección visible
  useEffect(() => {
    if (isLoading || platformRoles.length === 0) return
    const current = SECTIONS.find(
      (s) => pathname === s.href || (s.href !== "/plataforma" && pathname.startsWith(s.href))
    )
    if (pathname === "/plataforma" && current && !current.roles.some((r) => platformRoles.includes(r))) {
      router.replace(firstSectionFor(platformRoles))
    }
  }, [isLoading, platformRoles, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <p className="animate-pulse text-sm" style={{ color: "var(--text-muted)" }}>Cargando consola…</p>
      </div>
    )
  }

  if (platformRoles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg-primary)" }}>
        <ShieldAlert size={40} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Esta consola es exclusiva del equipo de la plataforma.
        </p>
        <Link href="/dashboard" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          Volver a mi negocio
        </Link>
      </div>
    )
  }

  const userName = session?.user?.name ?? "Usuario"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <SessionGuard />
      {/* Sidebar de la consola — mismo lenguaje visual que el sidebar del tenant */}
      <aside
        className="w-64 flex flex-col shrink-0 h-full"
        style={{ background: "var(--bg-inverse)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Shield size={20} style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-white">
              PLATAFORMA
            </p>
            <p className="text-[10px] tracking-widest" style={{ color: "#8FA0BC" }}>
              CONSOLA CO$AYB
            </p>
          </div>
        </div>

        {/* Navegación por sub-rol */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1" role="list">
            {visibleSections.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/plataforma"
                  ? pathname === "/plataforma"
                  : pathname.startsWith(href)
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
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent"
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Usuario + salir */}
        <div className="px-4 py-4 flex flex-col gap-2 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" style={{ color: "#E2E8F0" }}>{userName}</span>
              <span className="text-[10px] truncate" style={{ color: "#8FA0BC" }}>
                {platformRoles.join(" · ")}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              clearSWRCache()
              await authClient.signOut()
              window.location.replace("/login")
            }}
            className="flex items-center gap-2 px-1 py-1.5 text-xs transition-colors"
            style={{ color: "#8FA0BC", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8FA0BC")}
          >
            <LogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>

      {/* Clases console-* mapeadas a los tokens del design system del proyecto */}
      <style>{`
        .console-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
        }
        .console-title { color: var(--text-primary); }
        .console-muted { color: var(--text-muted); }
        .console-accent { color: var(--accent); }
        .console-input {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          color: var(--text-primary);
          outline: none;
        }
        .console-row {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .console-row:hover {
          border-color: var(--border-medium);
          box-shadow: 0 2px 10px rgba(18,33,58,0.06);
        }
      `}</style>
    </div>
  )
}

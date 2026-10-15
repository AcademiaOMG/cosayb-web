"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Menu, Shield, X } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { clearSWRCache } from "@/components/SWRProvider"
import SessionGuard from "@/components/SessionGuard"
import { authClient } from "@/lib/auth"
import AccessDenied from "@/components/ui/AccessDenied"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { roleLabel } from "@/lib/plataforma/labels"
import { landingRedirect } from "@/lib/plataforma/nav"
import PlatformNav from "./PlatformNav"
import Breadcrumbs from "./Breadcrumbs"
import PlatformStyles from "./PlatformStyles"

// Shell de la consola de la plataforma: mismo lenguaje visual que la app (tema neutro, vidrio
// sutil, barra lateral navy en escritorio) y menú desplegable en móvil. La lógica de acceso
// (visibilidad por rol y landing) vive en lib/plataforma/nav.ts.

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <Shield size={20} aria-hidden="true" style={{ color: "#7CA8FF" }} />
      <div className="leading-tight">
        <p className="font-display text-lg font-bold text-white">CO$AYB</p>
        <p className="text-[11px]" style={{ color: "#8497B4" }}>Administración</p>
      </div>
    </div>
  )
}

export default function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { platformRoles, memberships, isLoading } = usePermissions()
  const { data: session } = authClient.useSession()
  // El menú guarda la ruta en la que se abrió: al navegar queda cerrado sin efectos extra
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const menuOpen = openedAt === pathname
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  // Landing por sub-rol: si la ruta actual no le corresponde, llevarlo a su primera sección visible
  useEffect(() => {
    if (isLoading) return
    const target = landingRedirect(pathname, platformRoles)
    if (target) router.replace(target)
  }, [isLoading, platformRoles, pathname, router])

  const closeMenu = useCallback(() => {
    setOpenedAt(null)
    menuBtnRef.current?.focus()
  }, [])

  async function handleSignOut() {
    clearSWRCache()
    try {
      await authClient.signOut()
    } catch {
      // Sin red igual se sale: la caché ya está limpia
    }
    window.location.replace("/login")
  }

  if (isLoading) {
    return (
      <div className="h-screen supports-[height:100dvh]:h-dvh" style={{ background: "var(--bg-primary)" }}>
        <LoadingBlock label="Cargando la plataforma…" className="h-full" />
      </div>
    )
  }

  if (platformRoles.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <AccessDenied message="Esta consola es exclusiva del equipo de la plataforma." />
        <a href="/dashboard" className="plat-link -mt-8 mb-8 rounded text-sm font-medium" style={{ color: "var(--accent-text)" }}>
          Volver a mi negocio
        </a>
        <PlatformStyles />
      </div>
    )
  }

  const userName = session?.user?.name ?? "Usuario"
  const roles = platformRoles.map(roleLabel).join(" · ")
  const canGoBack = memberships.length > 0

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-dvh overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <SessionGuard />

      {/* Barra lateral (escritorio) */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col lg:flex"
        style={{ background: "var(--bg-inverse)" }}
      >
        <div className="flex h-16 shrink-0 items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Link href="/plataforma" className="plat-link rounded" aria-label="Plataforma CO$AYB, ir al inicio">
            <Brand />
          </Link>
        </div>
        <PlatformNav platformRoles={platformRoles} />
        <div className="shrink-0 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button type="button" onClick={handleSignOut} className="plat-nav-link w-full cursor-pointer border-0 bg-transparent">
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Barra superior */}
        <header
          className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 sm:px-6"
          style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setOpenedAt(menuOpen ? null : pathname)}
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="plataforma-menu-movil"
              className="plat-btn lg:hidden"
              style={{ width: 44, height: 44, justifyContent: "center", padding: 0 }}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <Breadcrumbs />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canGoBack && (
              <a href="/dashboard" className="plat-btn" title="Volver a mi negocio">
                <ArrowLeft size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Volver a mi negocio</span>
                <span className="sr-only sm:hidden">Volver a mi negocio</span>
              </a>
            )}
            <div className="flex items-center gap-2.5 pl-1">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden min-w-0 flex-col leading-tight md:flex">
                <span className="max-w-[180px] truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{userName}</span>
                <span className="max-w-[180px] truncate text-xs" style={{ color: "var(--text-muted)" }}>{roles}</span>
              </span>
            </div>
            <button type="button" onClick={handleSignOut} className="plat-btn hidden sm:inline-flex" title="Cerrar sesión">
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden xl:inline">Cerrar sesión</span>
              <span className="sr-only xl:hidden">Cerrar sesión</span>
            </button>
          </div>
        </header>

        <main
          id="contenido"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden outline-none"
          style={{ background: "var(--bg-primary)" }}
        >
          {/* key=pathname: cada página nueva entra con su transición */}
          <div key={pathname} className="anim-view">
            <div className="mx-auto w-full min-w-0 max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>

      {menuOpen && (
        <MobileMenu
          platformRoles={platformRoles}
          userName={userName}
          roles={roles}
          onClose={closeMenu}
          onSignOut={handleSignOut}
        />
      )}
      <PlatformStyles />
    </div>
  )
}

function MobileMenu({
  platformRoles, userName, roles, onClose, onSignOut,
}: {
  platformRoles: string[]
  userName: string
  roles: string
  onClose: () => void
  onSignOut: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>("a, button")?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== "Tab" || !panel) return
      const items = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    const mainEl = document.querySelector<HTMLElement>("main")
    const prev = mainEl?.style.overflowY ?? ""
    if (mainEl) mainEl.style.overflowY = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      if (mainEl) mainEl.style.overflowY = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="plat-drawer-backdrop absolute inset-0"
        style={{ background: "rgba(18,33,58,0.45)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        id="plataforma-menu-movil"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de la plataforma"
        className="plat-drawer-panel absolute bottom-0 left-0 top-0 flex w-[min(20rem,86vw)] flex-col"
        style={{ background: "var(--bg-inverse)" }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="plat-nav-link"
            style={{ width: 44, height: 44, justifyContent: "center", padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <PlatformNav platformRoles={platformRoles} onNavigate={onClose} />
        <div className="shrink-0 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="truncate px-3 text-sm font-semibold text-white">{userName}</p>
          <p className="mb-2 truncate px-3 text-xs" style={{ color: "#8497B4" }}>{roles}</p>
          <button type="button" onClick={onSignOut} className="plat-nav-link w-full cursor-pointer border-0 bg-transparent">
            <LogOut size={18} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

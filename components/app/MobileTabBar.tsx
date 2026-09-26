"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, UserCircle, HelpCircle } from "lucide-react"
import { useHelpAvailableSnapshot } from "@/hooks/useHelpAvailable"
import "./mobile-tab-bar.css"

// Reemplaza al Topbar en mobile en toda la app — sin drawer, sin "menú",
// sin nada oculto detrás de un botón. Inicio ya es el hub completo (todos
// los módulos + Configuración + Cuenta viven ahí como cards), así que la
// barra solo necesita destinos directos que no dependan de otra pantalla:
// Inicio, Ayuda (si la pantalla la tiene) y Cuenta (perfil, seguridad,
// cambiar de negocio, cerrar sesión — todo vive ahí ahora).
export default function MobileTabBar() {
  const pathname = usePathname()
  const helpAvailable = useHelpAvailableSnapshot()
  const isHome = pathname === "/dashboard"
  const isAccount = pathname === "/cuenta"

  return (
    <nav
      className="mobile-tab-bar fixed bottom-5 left-1/2 z-20 flex items-center gap-1 lg:hidden"
      style={{ transform: "translateX(-50%)", padding: 6, borderRadius: 9999 }}
      aria-label="Navegación"
    >
      <TabLink href="/dashboard" label="Inicio" active={isHome}>
        <Home size={20} />
      </TabLink>

      {helpAvailable && (
        <TabButton onClick={() => window.dispatchEvent(new Event("open-help"))} label="Ayuda">
          <HelpCircle size={20} />
        </TabButton>
      )}

      <TabLink href="/cuenta" label="Cuenta" active={isAccount}>
        <UserCircle size={20} />
      </TabLink>
    </nav>
  )
}

function TabLink({ href, label, active, children }: { href: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex items-center justify-center w-11 h-11 rounded-full transition-colors"
      style={{
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
      }}
    >
      {children}
    </Link>
  )
}

function TabButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center w-11 h-11 rounded-full transition-colors"
      style={{ color: "var(--text-secondary)" }}
    >
      {children}
    </button>
  )
}

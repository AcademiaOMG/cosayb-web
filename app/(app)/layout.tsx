import AppShell from "@/components/app/AppShell"
import { UpgradeModalProvider } from "@/components/app/settings/UpgradeModalProvider"
import UpgradeModal from "@/components/app/settings/UpgradeModal"

// AppShell ya monta <SessionGuard /> internamente (components/app/AppShell.tsx) —
// no duplicarlo aquí: dos instancias en el mismo árbol compiten entre sí por el
// bloqueo de pestañas (cada una genera su propio tabId y se ven como "otra pestaña").
// app-theme-neutral: reemplaza los tokens de fondo/texto/borde beige del
// sistema global por blanco/gris claro, solo dentro de la app autenticada
// (no toca marketing, login, registro ni /plataforma). Ver definición de
// los tokens en globals.css.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-theme-neutral">
      <UpgradeModalProvider>
        <AppShell>{children}</AppShell>
        <UpgradeModal />
      </UpgradeModalProvider>
    </div>
  )
}

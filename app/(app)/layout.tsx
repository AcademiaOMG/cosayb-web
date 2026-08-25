import AppShell from "@/components/app/AppShell"
import { UpgradeModalProvider } from "@/components/app/settings/UpgradeModalProvider"
import UpgradeModal from "@/components/app/settings/UpgradeModal"

// AppShell ya monta <SessionGuard /> internamente (components/app/AppShell.tsx) —
// no duplicarlo aquí: dos instancias en el mismo árbol compiten entre sí por el
// bloqueo de pestañas (cada una genera su propio tabId y se ven como "otra pestaña").
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeModalProvider>
      <AppShell>{children}</AppShell>
      <UpgradeModal />
    </UpgradeModalProvider>
  )
}

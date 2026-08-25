import AppShell from "@/components/app/AppShell"
import { UpgradeModalProvider } from "@/components/app/settings/UpgradeModalProvider"
import UpgradeModal from "@/components/app/settings/UpgradeModal"
import SessionGuard from "@/components/SessionGuard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeModalProvider>
      <SessionGuard />
      <AppShell>{children}</AppShell>
      <UpgradeModal />
    </UpgradeModalProvider>
  )
}

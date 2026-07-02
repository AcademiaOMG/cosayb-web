import AppShell from "@/components/app/AppShell"
import { UpgradeModalProvider } from "@/components/app/settings/UpgradeModalProvider"
import UpgradeModal from "@/components/app/settings/UpgradeModal"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UpgradeModalProvider>
      <AppShell>{children}</AppShell>
      <UpgradeModal />
    </UpgradeModalProvider>
  )
}

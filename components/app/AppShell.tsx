"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { mutate } from "swr"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import MobileTabBar from "./MobileTabBar"
import AppContainer from "./AppContainer"
import ImpersonationBanner from "./ImpersonationBanner"
import SessionGuard from "@/components/SessionGuard"
import { authClient } from "@/lib/auth"
import { getCurrentOrganization } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { setActiveOrgId } from "@/lib/activeOrg"
import { clearSWRCache } from "@/components/SWRProvider"
import { toast } from "@/lib/toast"
import type { Plan } from "@/types/domain"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { identityType, impersonation, isLoading: permsLoading } = usePermissions()

  // Excepción: una identidad platform SÍ puede estar en el workspace tenant
  // mientras tenga una sesión de impersonación activa.
  useEffect(() => {
    if (!permsLoading && identityType === "platform" && !impersonation?.active) {
      router.replace("/plataforma")
    }
  }, [permsLoading, identityType, impersonation?.active, router])

  const { data: orgData } = useSWR(
    "organization-me",
    () => getCurrentOrganization().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  // Sincronizar la org activa persistida con la resuelta por el backend
  useEffect(() => {
    if (orgData?.id) setActiveOrgId(orgData.id)
  }, [orgData?.id])

  const orgName = orgData?.name ?? "Mi organización"
  const plan = (orgData?.effectiveMembership as Plan) ?? "free"

  async function handleSignOut() {
    // Orden importa: apagar/limpiar caché ANTES de invalidar y navegar
    clearSWRCache()
    setActiveOrgId(null)
    void mutate(() => true, undefined, { revalidate: false })
    try {
      await authClient.signOut()
    } catch {
      // Sin red el cierre en servidor puede fallar: igual se sale (caché ya limpia),
      // pero se avisa para que el usuario sepa que la sesión pudo quedar abierta.
      toast.warning("No pudimos confirmar el cierre de sesión en el servidor.")
    }
    // replace: la página autenticada no queda como entrada "adelante" del historial
    window.location.replace("/login")
  }

  const userName = session?.user?.name ?? "Usuario"

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <SessionGuard />
        <Sidebar userPlan={plan} onSignOut={handleSignOut} />

        <div className="flex flex-col flex-1 min-w-0 lg:pl-60">
          <Topbar
            orgName={orgName}
            userPlan={plan}
            userInitial={userName.charAt(0).toUpperCase()}
          />
          <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6 min-w-0 overflow-x-hidden overflow-y-auto animate-page-in" style={{ background: "var(--bg-primary)" }}>
            <AppContainer>{children}</AppContainer>
          </main>
          <MobileTabBar />
        </div>
      </div>
    </div>
  )
}
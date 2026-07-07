"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { mutate } from "swr"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import SessionGuard from "@/components/SessionGuard"
import { authClient } from "@/lib/auth"
import { getCurrentOrganization } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { setActiveOrgId } from "@/lib/activeOrg"
import { clearSWRCache } from "@/components/SWRProvider"
import type { Plan } from "@/types/domain"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const { identityType, isLoading: permsLoading } = usePermissions()

  // Una identidad de plataforma nunca opera el workspace tenant directamente
  useEffect(() => {
    if (!permsLoading && identityType === "platform") {
      router.replace("/plataforma")
    }
  }, [permsLoading, identityType, router])

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
    await authClient.signOut()
    // replace: la página autenticada no queda como entrada "adelante" del historial
    window.location.replace("/login")
  }

  const userName = session?.user?.name ?? "Usuario"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <SessionGuard />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userPlan={plan}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-col flex-1 min-w-0 lg:pl-60">
        <Topbar
          orgName={orgName}
          userPlan={plan}
          userInitial={userName.charAt(0).toUpperCase()}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6 animate-page-in" style={{ background: "var(--bg-primary)" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
"use client"

import { useState } from "react"
import useSWR from "swr"
import { mutate } from "swr"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { authClient } from "@/lib/auth"
import { getCurrentOrganization } from "@/lib/api"
import type { Plan } from "@/types/domain"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = authClient.useSession()

  const { data: orgData } = useSWR(
    "organization-me",
    () => getCurrentOrganization().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const orgName = orgData?.name ?? "Mi organización"
  const plan = (orgData?.plan as Plan) ?? "free"

  async function handleSignOut() {
    await authClient.signOut()
    void mutate(() => true, undefined, { revalidate: false })
    window.location.href = "/login"
  }

  const userName = session?.user?.name ?? "Usuario"

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
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
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--bg-primary)" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
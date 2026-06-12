"use client"

import { useState, useEffect } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import { authClient } from "@/lib/auth"
import type { Plan } from "@/types/domain"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = authClient.useSession()

  const [orgName, setOrgName] = useState("Mi organización")
  const [plan, setPlan] = useState<Plan>("free")

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
    fetch(`${apiUrl}/api/v1/organizations/me`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((body) => {
        if (body?.data) {
          setOrgName(body.data.name)
          setPlan(body.data.plan as Plan)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    await authClient.signOut()
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
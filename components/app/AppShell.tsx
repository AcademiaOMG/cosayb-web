"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // TODO: Inject real session data from better-auth useSession()
  const orgName = "Mi organización"
  const userName = "Usuario"
  const userPlan = "free" as const

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userPlan={userPlan}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 min-w-0 lg:pl-60">
        <Topbar
          orgName={orgName}
          userPlan={userPlan}
          userInitial={userName.charAt(0).toUpperCase()}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "var(--bg-primary)" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

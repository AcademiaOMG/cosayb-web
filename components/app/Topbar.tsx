"use client"

import { Menu } from "lucide-react"
import PlanBadge from "./settings/PlanBadge"
import type { Plan } from "@/types/domain"

export interface TopbarProps {
  orgName?: string
  userPlan?: Plan
  userInitial?: string
  onMenuClick: () => void
}

export default function Topbar({
  orgName = "Mi organización",
  userPlan = "free",
  userInitial = "U",
  onMenuClick,
}: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between h-16 px-6 shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Left: hamburger (mobile) + org name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 -ml-2"
          style={{ color: "var(--text-muted)" }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <span
          className="font-display text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {orgName}
        </span>
        <PlanBadge plan={userPlan} />
      </div>

      {/* Right: avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ background: "var(--accent)", color: "#fff" }}
        aria-label="Perfil de usuario"
      >
        {userInitial}
      </div>
    </header>
  )
}

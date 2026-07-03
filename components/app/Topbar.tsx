"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, ChevronDown, Check, Plus, Shield, HelpCircle } from "lucide-react"
import PlanBadge from "./settings/PlanBadge"
import type { Plan } from "@/types/domain"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { getActiveOrgId, setActiveOrgId, switchSurface } from "@/lib/surface"

export interface TopbarProps {
  orgName?: string
  userPlan?: Plan
  userInitial?: string
  onMenuClick: () => void
}

export default function Topbar({
  orgName = "Mi organización",
  userPlan = "free",
  onMenuClick,
}: TopbarProps) {
  const { memberships, isPlatform } = usePermissions()
  const helpAvailable = useHelpAvailable()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const activeOrgId = getActiveOrgId()
  const activeMembership =
    memberships.find((m) => m.organizationId === activeOrgId) ??
    memberships.find((m) => m.isDefault) ??
    memberships[0]

  function handleSwitchOrg(orgId: string) {
    setActiveOrgId(orgId)
    // Cambio de tenant = recarga completa (todo el estado SWR es de otra org)
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = "/dashboard"
  }

  return (
    <header
      className="flex items-center justify-between h-16 px-6 shrink-0"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Left: hamburger (mobile) + selector de organización */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-2 -ml-2"
          style={{ color: "var(--text-muted)" }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors"
            style={{ border: "1px solid transparent", background: "transparent", cursor: "pointer" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-primary)"
              e.currentTarget.style.borderColor = "var(--border-light)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = "transparent"
            }}
          >
            <span className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {activeMembership?.organizationName ?? orgName}
            </span>
            <PlanBadge plan={(activeMembership?.membership as Plan) ?? userPlan} />
            {(memberships.length > 1 || isPlatform) && (
              <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
            )}
          </button>

          {open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                minWidth: 260,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                borderRadius: 14,
                boxShadow: "0 8px 30px rgba(18,33,58,0.12)",
                padding: 6,
                zIndex: 50,
              }}
            >
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
                Mis negocios
              </p>
              {memberships.map((m) => {
                const active = m.organizationId === (activeMembership?.organizationId ?? "")
                return (
                  <button
                    key={m.organizationId}
                    onClick={() => handleSwitchOrg(m.organizationId)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="flex-1 truncate">{m.organizationName}</span>
                    {active && <Check size={14} style={{ color: "var(--accent)" }} />}
                  </button>
                )
              })}
              <button
                onClick={() => { window.location.href = "/onboarding?new=1" }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--accent)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Plus size={14} />
                Crear otro negocio
              </button>

              {isPlatform && (
                <>
                  <div style={{ height: 1, background: "var(--border-light)", margin: "6px 0" }} />
                  <button
                    onClick={() => switchSurface("platform")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left font-medium transition-colors"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#B45309" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF3C7")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Shield size={14} />
                    Cambiar a Plataforma
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: help button (only visible when a page has a help modal) */}
      {helpAvailable && (
        <button
          onClick={() => window.dispatchEvent(new Event("open-help"))}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
          style={{
            border: "1px solid var(--border-light)",
            background: "var(--bg-surface)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-secondary)"
            e.currentTarget.style.borderColor = "var(--border-medium)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)"
            e.currentTarget.style.borderColor = "var(--border-light)"
          }}
          title="Ayuda"
        >
          <HelpCircle size={18} />
        </button>
      )}
    </header>
  )
}

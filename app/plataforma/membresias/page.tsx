"use client"

import useSWR from "swr"
import { useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import { platformListMemberships, platformUpdateFeature, platformSetMembershipRoles, platformListRoles } from "@/lib/api"

const TIER_STYLE: Record<string, { color: string }> = {
  free: { color: "var(--text-muted)" },
  pro: { color: "var(--accent)" },
  academia: { color: "#16A34A" },
}

export default function MembresiasPage() {
  const { platformCan } = usePermissions()
  const { data, mutate } = useSWR("platform-memberships", () =>
    platformListMemberships().then((r) => r.data)
  )
  const { data: allRoles = [] } = useSWR("platform-roles-catalog", () =>
    platformListRoles().then((r) => r.data.filter((role) => role.scope === "organization" && role.slug !== "org_owner"))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const canEdit = platformCan("platform_memberships", "update")

  const tiers = ["free", "pro", "academia"] as const
  const featuresByTier = (tier: string) =>
    (data?.features ?? []).filter((f) => f.membership === tier)
  const rolesByTier = (tier: string) =>
    (data?.roleLimits ?? []).filter((r) => r.membership === tier)

  async function toggleRole(tier: string, roleId: string, enabled: boolean) {
    setSaving(`${tier}:role:${roleId}`)
    try {
      const current = rolesByTier(tier).map((r) => ({ roleId: r.roleId, maxUsers: r.maxUsers }))
      const next = enabled
        ? [...current, { roleId, maxUsers: null }]
        : current.filter((r) => r.roleId !== roleId)
      await platformSetMembershipRoles(tier, next)
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  async function changeRoleMaxUsers(tier: string, roleId: string, raw: string) {
    setSaving(`${tier}:role:${roleId}`)
    try {
      const maxUsers = raw === "" ? null : Math.max(0, parseInt(raw) || 0)
      const current = rolesByTier(tier).map((r) => ({ roleId: r.roleId, maxUsers: r.maxUsers }))
      const next = current.map((r) => (r.roleId === roleId ? { ...r, maxUsers } : r))
      await platformSetMembershipRoles(tier, next)
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  async function toggleFeature(tier: string, key: string, enabled: boolean) {
    setSaving(`${tier}:${key}`)
    try {
      await platformUpdateFeature(tier, key, { enabled })
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  async function changeLimit(tier: string, key: string, raw: string) {
    const limitValue = raw === "" ? null : Math.max(0, parseInt(raw) || 0)
    setSaving(`${tier}:${key}`)
    try {
      await platformUpdateFeature(tier, key, { limitValue })
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  async function changeLockedMessage(tier: string, key: string, raw: string) {
    setSaving(`${tier}:${key}`)
    try {
      await platformUpdateFeature(tier, key, { lockedMessage: raw.trim() || null })
      await mutate()
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Membresías</h1>
        <p className="text-sm console-muted mt-1">
          Features, límites y roles habilitados por tier. Los cambios aplican a todos los tenants del tier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {tiers.map((tier) => (
          <div key={tier} className="console-card">
            <p
              className="text-sm font-bold tracking-[0.2em] uppercase mb-5"
              style={{ color: TIER_STYLE[tier].color }}
            >
              {tier}
            </p>

            <p className="text-[10px] font-bold tracking-widest console-muted mb-2">FEATURES Y LÍMITES</p>
            <div className="flex flex-col gap-1.5 mb-5">
              {featuresByTier(tier).map((f) => (
                <div key={f.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      disabled={!canEdit || saving === `${tier}:${f.featureKey}`}
                      onChange={(e) => toggleFeature(tier, f.featureKey, e.target.checked)}
                      style={{ accentColor: "var(--accent)", cursor: canEdit ? "pointer" : "default" }}
                    />
                    <span className="flex-1 text-xs console-muted truncate">{f.featureKey}</span>
                    {f.featureKey.startsWith("max_") && (
                      <input
                        type="number"
                        defaultValue={f.limitValue ?? ""}
                        placeholder="∞"
                        disabled={!canEdit}
                        onBlur={(e) => canEdit && changeLimit(tier, f.featureKey, e.target.value)}
                        className="console-input text-xs text-right"
                        style={{ width: 58, height: 26, paddingRight: 6 }}
                      />
                    )}
                  </div>
                  {!f.enabled && (
                    <input
                      type="text"
                      defaultValue={f.lockedMessage ?? ""}
                      placeholder="Mensaje de bloqueo (opcional)"
                      disabled={!canEdit}
                      onBlur={(e) => canEdit && changeLockedMessage(tier, f.featureKey, e.target.value)}
                      className="console-input text-[11px] ml-6"
                      style={{ height: 24, paddingLeft: 8 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <p className="text-[10px] font-bold tracking-widest console-muted mb-2">ROLES ASIGNABLES</p>
            <div className="flex flex-col gap-1.5">
              {allRoles.map((role) => {
                const assignment = rolesByTier(tier).find((r) => r.roleId === role.id)
                const enabled = !!assignment
                return (
                  <div key={role.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={!canEdit || saving === `${tier}:role:${role.id}`}
                      onChange={(e) => toggleRole(tier, role.id, e.target.checked)}
                      style={{ accentColor: "var(--accent)", cursor: canEdit ? "pointer" : "default" }}
                    />
                    <span className="flex-1 text-xs console-muted truncate">{role.name}</span>
                    {enabled && (
                      <input
                        type="number"
                        defaultValue={assignment?.maxUsers ?? ""}
                        placeholder="∞"
                        disabled={!canEdit}
                        onBlur={(e) => canEdit && changeRoleMaxUsers(tier, role.id, e.target.value)}
                        className="console-input text-xs text-right"
                        style={{ width: 58, height: 26, paddingRight: 6 }}
                        title="Máximo de usuarios con este rol"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

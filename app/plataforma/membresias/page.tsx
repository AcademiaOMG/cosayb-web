"use client"

import useSWR from "swr"
import { useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import { platformListMemberships, platformUpdateFeature } from "@/lib/api"

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
  const [saving, setSaving] = useState<string | null>(null)
  const canEdit = platformCan("platform_memberships", "update")

  const tiers = ["free", "pro", "academia"] as const
  const featuresByTier = (tier: string) =>
    (data?.features ?? []).filter((f) => f.membership === tier)
  const rolesByTier = (tier: string) =>
    (data?.roleLimits ?? []).filter((r) => r.membership === tier)

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
            <div className="flex flex-wrap gap-1.5">
              {rolesByTier(tier).map((r) => (
                <span
                  key={r.roleId}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  {r.roleName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

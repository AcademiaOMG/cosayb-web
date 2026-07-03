"use client"

import useSWR from "swr"
import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { usePermissions } from "@/hooks/usePermissions"
import {
  platformListOrgs, platformUpdateOrg, platformSetOrgStatus,
  platformListUsers, platformListAudit, platformGetMetrics,
  platformListMemberships, platformUpdateFeature,
  type PlatformOrg,
} from "@/lib/api"
import {
  Building2, Users, CreditCard, ScrollText, BarChart3, Search,
  Ban, CheckCircle2, ShieldAlert,
} from "lucide-react"

type Tab = "metricas" | "organizaciones" | "usuarios" | "membresias" | "auditoria"

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "metricas", label: "Métricas", icon: BarChart3 },
  { key: "organizaciones", label: "Organizaciones", icon: Building2 },
  { key: "usuarios", label: "Usuarios", icon: Users },
  { key: "membresias", label: "Membresías", icon: CreditCard },
  { key: "auditoria", label: "Auditoría", icon: ScrollText },
]

const TIER_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: "var(--bg-secondary)", color: "var(--text-muted)" },
  pro: { bg: "var(--accent-light)", color: "var(--accent)" },
  academia: { bg: "#FEF3C7", color: "#92400E" },
}

export default function AdminPage() {
  const { isPlatform, isLoading } = usePermissions()
  const [tab, setTab] = useState<Tab>("metricas")

  if (isLoading) {
    return <p className="text-sm p-8" style={{ color: "var(--text-muted)" }}>Cargando…</p>
  }

  if (!isPlatform) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <ShieldAlert size={40} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Esta sección es exclusiva del equipo de la plataforma.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Plataforma" subtitle="Administración global de Cosayb" />

      <div
        style={{
          display: "inline-flex", borderRadius: "14px", flexWrap: "wrap",
          border: "1px solid var(--border-light)", background: "var(--bg-surface)",
          padding: "4px", gap: "4px", alignSelf: "flex-start",
        }}
      >
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "10px 16px", borderRadius: "10px", fontSize: "13px",
                fontWeight: 500, border: "none",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "metricas" && <MetricsTab />}
      {tab === "organizaciones" && <OrgsTab />}
      {tab === "usuarios" && <UsersTab />}
      {tab === "membresias" && <MembershipsTab />}
      {tab === "auditoria" && <AuditTab />}
    </div>
  )
}

// ─── Métricas ─────────────────────────────────────────────────────────────────

function MetricsTab() {
  const { data } = useSWR("platform-metrics", () => platformGetMetrics().then((r) => r.data))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          ORGANIZACIONES
        </p>
        <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {data?.totalOrganizations ?? "—"}
        </p>
      </Card>
      <Card>
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          USUARIOS
        </p>
        <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {data?.totalUsers ?? "—"}
        </p>
      </Card>
      <Card>
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          POR MEMBRESÍA
        </p>
        <div className="flex flex-col gap-1">
          {data?.organizationsByMembership.map((m) => (
            <div key={m.membership} className="flex justify-between text-sm">
              <span style={{ color: "var(--text-secondary)" }}>{m.membership}</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{m.total}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Organizaciones ───────────────────────────────────────────────────────────

function OrgsTab() {
  const [search, setSearch] = useState("")
  const { data, mutate } = useSWR(["platform-orgs", search], () =>
    platformListOrgs(search || undefined)
  )
  const [target, setTarget] = useState<PlatformOrg | null>(null)
  const [saving, setSaving] = useState(false)

  async function changeMembership(org: PlatformOrg, membership: string) {
    setSaving(true)
    try {
      await platformUpdateOrg(org.id, { membership })
      await mutate()
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(org: PlatformOrg) {
    setSaving(true)
    try {
      await platformSetOrgStatus(
        org.id,
        org.status === "active" ? "suspend" : "reactivate",
        "Acción desde panel de plataforma"
      )
      await mutate()
      setTarget(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <div className="relative mb-4" style={{ maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="search"
          placeholder="Buscar organización…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", height: 36, paddingLeft: 30, paddingRight: 10,
            borderRadius: 10, border: "1px solid var(--border-light)",
            background: "var(--bg-surface)", fontSize: 13, outline: "none",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {(data?.data ?? []).map((org) => {
          const tier = TIER_COLORS[org.membership] ?? TIER_COLORS.free
          return (
            <div
              key={org.id}
              className="flex items-center gap-3 p-3 rounded-xl flex-wrap"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {org.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>

              {org.status === "suspended" && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEE2E2", color: "#991B1B" }}>
                  Suspendida
                </span>
              )}

              <select
                value={org.membership}
                disabled={saving}
                onChange={(e) => changeMembership(org, e.target.value)}
                style={{
                  height: 30, borderRadius: 8, padding: "0 8px", fontSize: 12,
                  border: "1px solid var(--border-light)",
                  background: tier.bg, color: tier.color, fontWeight: 600,
                  cursor: "pointer", outline: "none",
                }}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="academia">Academia</option>
              </select>

              <button
                onClick={() => setTarget(org)}
                title={org.status === "active" ? "Suspender" : "Reactivar"}
                className="p-1.5 rounded-lg"
                style={{ color: org.status === "active" ? "#EF4444" : "#16A34A", cursor: "pointer", border: "none", background: "transparent" }}
              >
                {org.status === "active" ? <Ban size={15} /> : <CheckCircle2 size={15} />}
              </button>
            </div>
          )
        })}
        {(data?.data ?? []).length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
            Sin resultados.
          </p>
        )}
      </div>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title={target?.status === "active" ? "Suspender organización" : "Reactivar organización"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setTarget(null)} disabled={saving}>Cancelar</Button>
            <Button
              variant={target?.status === "active" ? "danger" : "primary"}
              onClick={() => target && toggleStatus(target)}
              loading={saving}
            >
              {target?.status === "active" ? "Suspender" : "Reactivar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {target?.status === "active"
            ? `Los miembros de "${target?.name}" perderán acceso hasta que se reactive. La acción queda auditada.`
            : `Los miembros de "${target?.name}" recuperarán el acceso. La acción queda auditada.`}
        </p>
      </Modal>
    </Card>
  )
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("")
  const { data } = useSWR(["platform-users", search], () =>
    platformListUsers(search || undefined)
  )

  return (
    <Card>
      <div className="relative mb-4" style={{ maxWidth: 320 }}>
        <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="search"
          placeholder="Buscar por email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", height: 36, paddingLeft: 30, paddingRight: 10,
            borderRadius: 10, border: "1px solid var(--border-light)",
            background: "var(--bg-surface)", fontSize: 13, outline: "none",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {(data?.data ?? []).map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date(u.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Membresías ───────────────────────────────────────────────────────────────

function MembershipsTab() {
  const { data, mutate } = useSWR("platform-memberships", () =>
    platformListMemberships().then((r) => r.data)
  )
  const [saving, setSaving] = useState<string | null>(null)

  const tiers = ["free", "pro", "academia"] as const
  const featuresByTier = (tier: string) =>
    (data?.features ?? []).filter((f) => f.membership === tier)

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {tiers.map((tier) => {
        const tierColor = TIER_COLORS[tier]
        return (
          <Card key={tier}>
            <p
              className="text-xs font-bold tracking-widest mb-4 px-2 py-1 rounded-full inline-block"
              style={{ background: tierColor.bg, color: tierColor.color }}
            >
              {tier.toUpperCase()}
            </p>
            <div className="flex flex-col gap-2">
              {featuresByTier(tier).map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    disabled={saving === `${tier}:${f.featureKey}`}
                    onChange={(e) => toggleFeature(tier, f.featureKey, e.target.checked)}
                  />
                  <span className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {f.featureKey}
                  </span>
                  {f.featureKey.startsWith("max_") && (
                    <input
                      type="number"
                      defaultValue={f.limitValue ?? ""}
                      placeholder="∞"
                      onBlur={(e) => changeLimit(tier, f.featureKey, e.target.value)}
                      style={{
                        width: 60, height: 26, borderRadius: 6, fontSize: 12,
                        border: "1px solid var(--border-light)", textAlign: "right",
                        background: "var(--bg-surface)", color: "var(--text-primary)",
                        paddingRight: 6, outline: "none",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

function AuditTab() {
  const { data } = useSWR("platform-audit", () => platformListAudit().then((r) => r.data))

  return (
    <Card>
      <div className="flex flex-col gap-2">
        {(data ?? []).map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <ScrollText size={14} className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {log.action}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Actor: {log.actorUserId} · {log.resourceType}
                {log.resourceId ? ` · ${log.resourceId}` : ""}
                {log.justification ? ` · "${log.justification}"` : ""}
              </p>
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
        {(data ?? []).length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
            Sin entradas de auditoría.
          </p>
        )}
      </div>
    </Card>
  )
}

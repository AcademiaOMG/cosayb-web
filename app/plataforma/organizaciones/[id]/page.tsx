"use client"

import useSWR from "swr"
import { useState, use } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { platformGetOrg, platformUpdateOrg, platformSetOrgStatus } from "@/lib/api"
import { ArrowLeft, Ban, CheckCircle2, Users, Calendar, CreditCard } from "lucide-react"

export default function OrganizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { platformCan } = usePermissions()
  const { data: org, mutate } = useSWR(["platform-org", id], () =>
    platformGetOrg(id).then((r) => r.data)
  )

  const [saving, setSaving] = useState(false)
  const [justification, setJustification] = useState("")
  const [confirmSuspend, setConfirmSuspend] = useState(false)

  const canUpdate = platformCan("platform_organizations", "update")
  const canSuspend = platformCan("platform_organizations", "suspend")

  async function changeMembership(membership: "free" | "pro" | "academia") {
    if (!org) return
    setSaving(true)
    try {
      // Optimista: el botón se marca de inmediato; si la API falla, revierte
      await mutate(
        platformUpdateOrg(id, { membership }).then((r) => ({ ...org, ...r.data })),
        {
          optimisticData: { ...org, membership },
          rollbackOnError: true,
          revalidate: false,
        }
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus() {
    if (!org) return
    setSaving(true)
    try {
      await platformSetOrgStatus(
        id,
        org.status === "active" ? "suspend" : "reactivate",
        justification || undefined
      )
      await mutate()
      setConfirmSuspend(false)
      setJustification("")
    } finally {
      setSaving(false)
    }
  }

  if (!org) {
    return <p className="text-sm console-muted animate-pulse">Cargando organización…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/plataforma/organizaciones"
          className="inline-flex items-center gap-1.5 text-xs console-muted mb-3 hover:underline"
        >
          <ArrowLeft size={12} /> Organizaciones
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold console-title">{org.name}</h1>
          {org.status === "suspended" && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
            >
              SUSPENDIDA
            </span>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="console-card">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">MIEMBROS</p>
          </div>
          <p className="text-2xl font-bold console-title">{org.memberCount}</p>
        </div>
        <div className="console-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">CREADA</p>
          </div>
          <p className="text-sm font-semibold console-title">
            {new Date(org.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="console-card">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">TRIAL</p>
          </div>
          <p className="text-sm font-semibold console-title">
            {org.trialEndsAt
              ? new Date(org.trialEndsAt) > new Date()
                ? `Activo hasta ${new Date(org.trialEndsAt).toLocaleDateString("es-CO")}`
                : "Expirado"
              : "Sin trial"}
          </p>
        </div>
      </div>

      {/* Membresía */}
      <div className="console-card">
        <p className="text-[11px] font-bold tracking-widest console-muted mb-4">MEMBRESÍA</p>
        <div className="flex gap-2 flex-wrap">
          {(["free", "pro", "academia"] as const).map((tier) => {
            const active = org.membership === tier
            return (
              <button
                key={tier}
                disabled={!canUpdate || saving || active}
                onClick={() => changeMembership(tier)}
                className="px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                  cursor: canUpdate && !active ? "pointer" : "default",
                  opacity: !canUpdate && !active ? 0.4 : 1,
                }}
              >
                {tier}
              </button>
            )
          })}
        </div>
        {!canUpdate && (
          <p className="text-xs console-muted mt-3">Tu rol no permite cambiar la membresía.</p>
        )}
      </div>

      {/* Suspensión */}
      {canSuspend && (
        <div className="console-card">
          <p className="text-[11px] font-bold tracking-widest console-muted mb-4">
            {org.status === "active" ? "SUSPENDER ORGANIZACIÓN" : "REACTIVAR ORGANIZACIÓN"}
          </p>

          {!confirmSuspend ? (
            <button
              onClick={() => setConfirmSuspend(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: org.status === "active" ? "#FEE2E2" : "#ECFDF5",
                color: org.status === "active" ? "#B91C1C" : "#16A34A",
                border: "none",
                cursor: "pointer",
              }}
            >
              {org.status === "active" ? <Ban size={14} /> : <CheckCircle2 size={14} />}
              {org.status === "active" ? "Suspender" : "Reactivar"}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm console-title">
                {org.status === "active"
                  ? `Los miembros de "${org.name}" perderán acceso. La acción queda auditada.`
                  : `Los miembros de "${org.name}" recuperarán acceso. La acción queda auditada.`}
              </p>
              <input
                type="text"
                placeholder="Justificación (queda en auditoría)"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="console-input text-sm px-3"
                style={{ height: 38, maxWidth: 420 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setConfirmSuspend(false); setJustification("") }}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm console-muted"
                  style={{ background: "transparent", border: "1px solid var(--border-light)", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={toggleStatus}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: org.status === "active" ? "#DC2626" : "#059669",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Aplicando…" : org.status === "active" ? "Confirmar suspensión" : "Confirmar reactivación"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

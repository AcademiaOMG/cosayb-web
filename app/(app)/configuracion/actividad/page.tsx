"use client"

import useSWR from "swr"
import { getOrganizationActivity } from "@/lib/api"

const ACTION_LABELS: Record<string, string> = {
  "impersonation.start": "Inició una sesión de soporte",
  "impersonation.elevate": "Habilitó edición durante soporte",
  "impersonation.end": "Terminó la sesión de soporte",
}

function labelFor(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  if (action.startsWith("impersonation.write.")) return "Realizó un cambio durante soporte"
  return action
}

export default function ActividadPage() {
  const { data: entries, isLoading } = useSWR("organization-activity", () =>
    getOrganizationActivity().then((r) => r.data)
  )

  if (isLoading) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando actividad…</p>
  }

  if (!entries?.length) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        El equipo de soporte de Cosayb no ha accedido a tu organización.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Registro de cada vez que soporte de Cosayb accedió a tu organización.
      </p>
      {entries.map((e) => (
        <div
          key={e.id}
          className="rounded-xl p-4"
          style={{ border: "1px solid var(--border-light)", background: "var(--bg-surface)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {labelFor(e.action)}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date(e.createdAt).toLocaleString("es-CO")}
            </span>
          </div>
          {e.justification && (
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Motivo: {e.justification}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

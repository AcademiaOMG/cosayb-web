"use client"

import useSWR from "swr"
import Link from "next/link"
import { Lock } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { usePermissions } from "@/hooks/usePermissions"
import { getOrganizationActivity } from "@/lib/api"

const DEFAULT_LOCKED_MESSAGE = "El registro de actividad no está disponible en tu plan actual."

const ACTION_LABELS: Record<string, string> = {
  "organization.create": "Se creó la organización",
  "invitation.create": "Se envió una invitación",
  "invitation.accept": "Se aceptó una invitación",
  "member.role_change": "Se cambió el rol de un miembro",
  "member.remove": "Se eliminó a un miembro",
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
  const { hasFeature, featureLockedMessage } = usePermissions()
  const unlocked = hasFeature("activity_log")

  const { data: entries, isLoading } = useSWR(
    unlocked ? "organization-activity" : null,
    () => getOrganizationActivity().then((r) => r.data)
  )

  if (!unlocked) {
    const message = featureLockedMessage("activity_log") || DEFAULT_LOCKED_MESSAGE
    return (
      <Card className="flex flex-col items-center text-center gap-3 py-10">
        <Lock size={28} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
        <Link href="/configuracion/membresia">
          <Button variant="primary" size="sm">Ver planes</Button>
        </Link>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl h-12" style={{ background: "var(--bg-surface)" }} />
        ))}
      </div>
    )
  }

  if (!entries?.length) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Todavía no hay actividad registrada en tu organización.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Registro de la actividad administrativa de tu organización.
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

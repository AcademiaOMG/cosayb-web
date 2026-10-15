"use client"

import useSWR from "swr"
import Link from "next/link"
import { Lock, ScrollText } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { usePermissions } from "@/hooks/usePermissions"
import { getOrganizationActivity } from "@/lib/api"
import { auditLabel, getOrganizationAudit, type AuditEntry } from "@/lib/saas/account"

const DEFAULT_LOCKED_MESSAGE = "El registro de actividad no está disponible en tu plan actual."

/** Auditoría completa (contrato nuevo); si el API aún no la tiene, cae al registro de soporte anterior. */
async function loadEntries(): Promise<AuditEntry[]> {
  try {
    return await getOrganizationAudit(100)
  } catch {
    const legacy = await getOrganizationActivity().then((r) => r.data)
    return legacy.map((e) => ({ id: e.id, action: e.action, actorUserId: e.actorUserId, justification: e.justification, createdAt: e.createdAt }))
  }
}

export default function ActividadPage() {
  const { hasFeature, featureLockedMessage } = usePermissions()
  const unlocked = hasFeature("activity_log")

  const { data: entries, error, isLoading, mutate } = useSWR(unlocked ? "organization-audit" : null, loadEntries, {
    revalidateOnFocus: false,
  })

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

  if (error) return <ErrorState title="No pudimos cargar la actividad" onRetry={() => mutate()} />
  if (isLoading || !entries) return <LoadingBlock />

  if (!entries.length) {
    return (
      <EmptyState
        icon={<ScrollText size={28} />}
        title="Todavía no hay actividad"
        description="Aquí verás los cambios de equipo, facturación y seguridad de tu organización."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Registro de la actividad administrativa, de facturación y de seguridad de tu organización.
      </p>
      {entries.map((e) => (
        <div
          key={e.id}
          className="rounded-xl p-4"
          style={{ border: "1px solid var(--border-light)", background: "var(--bg-surface)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {auditLabel(e.action)}
              {e.impersonated && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
                  SOPORTE
                </span>
              )}
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

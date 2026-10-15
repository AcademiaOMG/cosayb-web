"use client"

import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react"
import Button from "@/components/ui/Button"
import StatusPill from "@/components/plataforma/StatusPill"
import { checkedAtLabel, statusHeadline, type VigilanciaStatus } from "@/lib/plataforma/vigilancia"

/** Estado general: «Todo en orden» o «N alertas activas», con la hora de la última comprobación y botón de actualizar. */
export default function StatusBanner({
  status,
  checkedAt,
  refreshing,
  onRefresh,
}: {
  status: VigilanciaStatus
  checkedAt: string
  refreshing: boolean
  onRefresh: () => void
}) {
  const h = statusHeadline(status)
  const Icon = status.ok ? CheckCircle2 : ShieldAlert
  const color = h.tone === "success" ? "#047857" : h.tone === "danger" ? "#B91C1C" : "#B45309"
  return (
    <section
      aria-label="Estado general"
      className="console-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: color }}
    >
      <div className="flex items-start gap-3">
        <Icon size={32} aria-hidden="true" className="shrink-0" style={{ color }} />
        <div className="flex flex-col gap-1">
          <p className="font-display text-2xl font-bold leading-tight console-title" role="status">{h.title}</p>
          <p className="text-sm console-muted">{h.detail}</p>
          {status.critical > 0 && <StatusPill tone="danger">Requiere atención ahora</StatusPill>}
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Button variant="ghost" size="sm" onClick={onRefresh} loading={refreshing}>
          <RefreshCw size={14} aria-hidden="true" /> Actualizar
        </Button>
        <p className="text-xs console-muted">Última comprobación: {checkedAtLabel(checkedAt)}</p>
      </div>
    </section>
  )
}

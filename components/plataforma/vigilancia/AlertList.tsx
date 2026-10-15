"use client"

import Link from "next/link"
import { Lightbulb } from "lucide-react"
import StatusPill from "@/components/plataforma/StatusPill"
import { alertSeverityLabel } from "@/lib/plataforma/labels"
import { alertLinkTarget, severityTone, type VigilanciaAlert } from "@/lib/plataforma/vigilancia"
import { timeAgoEs } from "@/lib/saas/format"

const BORDER: Record<VigilanciaAlert["severity"], string> = { critical: "#B91C1C", warning: "#B45309", info: "var(--border-light)" }

/** Alertas activas: severidad, qué pasa, qué hacer y enlace a la ficha o pantalla relacionada. */
export default function AlertList({ alerts, onGoHealth }: { alerts: VigilanciaAlert[]; onGoHealth: () => void }) {
  if (alerts.length === 0) {
    return (
      <section aria-labelledby="alertas-titulo" className="flex flex-col gap-3">
        <h2 id="alertas-titulo" className="text-lg font-bold console-title">Alertas activas</h2>
        <p className="console-card text-sm console-muted">Ninguna por ahora. Esta lista se recalcula cada vez que abres o actualizas la pantalla.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby="alertas-titulo" className="flex flex-col gap-3">
      <h2 id="alertas-titulo" className="text-lg font-bold console-title">Alertas activas</h2>
      <ul className="flex flex-col gap-3">
        {alerts.map((a) => {
          const link = alertLinkTarget(a.link)
          return (
            <li key={a.id} className="console-card flex flex-col gap-2" style={{ borderColor: BORDER[a.severity] }}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={severityTone(a.severity)}>{alertSeverityLabel(a.severity)}</StatusPill>
                <h3 className="text-base font-semibold console-title">{a.title}</h3>
                {a.since && <span className="text-xs console-muted">desde {timeAgoEs(a.since)}</span>}
              </div>
              <p className="text-sm console-title">{a.explanation}</p>
              <p className="flex items-start gap-2 text-sm console-muted">
                <Lightbulb size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span><strong>Qué hacer:</strong> {a.advice}</span>
              </p>
              {link.href ? (
                <Link href={link.href} className="plat-link w-fit text-sm font-medium console-accent underline">{link.label}</Link>
              ) : (
                <button type="button" onClick={onGoHealth} className="plat-link w-fit text-sm font-medium console-accent underline" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                  {link.label}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

"use client"

import { useState } from "react"
import useSWR from "swr"
import { History } from "lucide-react"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { auditActionLabel } from "@/lib/plataforma/labels"
import type { ActivityRow } from "@/lib/plataforma/clientes"
import { timeAgoEs } from "@/lib/saas/format"

/** Historial de acciones auditadas; carga de a 30 con «Ver más». */
export default function ActivityList({ cacheKey, load, emptyText }: { cacheKey: string; load: (offset: number) => Promise<{ data: ActivityRow[]; total: number }>; emptyText: string }) {
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const { data, error, mutate } = useSWR(["clientes-activity", cacheKey], () => load(0), { revalidateOnFocus: false, onSuccess: (d) => setRows(d.data) })

  if (error && !data) return <ErrorState title="No pudimos cargar la actividad" onRetry={() => void mutate()} />
  if (!data) return <LoadingBlock label="Cargando actividad…" />
  if (data.total === 0) return <EmptyState icon={<History size={32} aria-hidden="true" />} title="Sin actividad registrada" description={emptyText} />

  async function more() {
    setLoadingMore(true)
    try {
      const next = await load(rows.length)
      setRows((r) => [...r, ...next.data])
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="console-card flex flex-col gap-1">
      <ul className="flex flex-col">
        {rows.map((a) => (
          <li key={a.id} className="flex flex-col gap-0.5 py-2.5" style={{ borderBottom: "1px solid var(--border-light)" }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm console-title">{auditActionLabel(a.action)}</span>
              <span className="text-xs console-muted" title={new Date(a.createdAt).toLocaleString("es-CO")}>{timeAgoEs(a.createdAt)}</span>
            </div>
            <span className="text-xs console-muted">
              {a.direction === "own" ? "Lo hizo el propio usuario" : a.actorName ? `${a.actorName}${a.byPlatformTeam ? " (equipo de la plataforma)" : ""}` : "Sistema"}
              {a.organizationName ? ` · ${a.organizationName}` : ""}
            </span>
            {a.justification && <span className="text-xs console-muted">Motivo: {a.justification}</span>}
          </li>
        ))}
      </ul>
      {rows.length < data.total && (
        <div className="pt-3">
          <Button variant="ghost" size="sm" loading={loadingMore} onClick={more}>Ver más ({data.total - rows.length} restantes)</Button>
        </div>
      )}
    </div>
  )
}

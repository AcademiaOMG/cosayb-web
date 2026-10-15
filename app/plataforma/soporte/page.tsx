"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { TicketStatusBadge } from "@/components/saas/StatusBadge"
import { FilterSelect, Pager, SearchBox, useDebounced } from "@/components/plataforma/negocio/ListControls"
import TicketDetailModal from "@/components/plataforma/negocio/TicketDetailModal"
import { negocioApi, slaState, type TicketStatusApi } from "@/lib/plataforma/negocio"
import { fmtDate } from "@/lib/saas/format"
import { TICKET_CATEGORIES } from "@/lib/saas/support"

const PAGE = 20
const STATUS_IDS: (TicketStatusApi | "all")[] = ["all", "open", "in_progress", "resolved", "closed"]
const STATUS_NAMES: Record<TicketStatusApi | "all", string> = { all: "Todos", open: "Abiertos", in_progress: "En curso", resolved: "Resueltos", closed: "Cerrados" }
const AGE_OPTIONS = [
  { id: "all", label: "Cualquier antigüedad" },
  { id: "24", label: "Más de 1 día" },
  { id: "48", label: "Más de 2 días" },
  { id: "168", label: "Más de 7 días" },
]
const SLA_COLOR = { ok: "var(--text-muted)", warning: "#B45309", late: "#B91C1C", done: "var(--text-muted)" } as const

function Content() {
  const params = useSearchParams()
  const initial = params.get("status") as TicketStatusApi | null
  const [status, setStatus] = useState<TicketStatusApi | "all">(initial && STATUS_IDS.includes(initial) ? initial : "open")
  const [category, setCategory] = useState("all")
  const [age, setAge] = useState("all")
  const [search, setSearch] = useState("")
  const [oldestFirst, setOldestFirst] = useState(true)
  const [offset, setOffset] = useState(0)
  const [openId, setOpenId] = useState<string | null>(params.get("abrir"))
  const term = useDebounced(search)

  const filters = {
    search: term || undefined,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    olderThanHours: age === "all" ? undefined : age,
    sort: "createdAt",
    order: oldestFirst ? "asc" : "desc",
  }
  const { data, error, isLoading, mutate } = useSWR(["negocio-tickets", filters, offset], () => negocioApi.tickets({ ...filters, limit: PAGE, offset }), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setOffset(0)
  }
  const filtered = category !== "all" || age !== "all" || !!term

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Soporte</h1>
        <p className="text-sm console-muted mt-1">
          Mensajes de clientes y visitantes.
          {data && data.counts.overdue > 0 && (
            <strong style={{ color: "#B91C1C" }}> {data.counts.overdue} sin atender hace más de {data.slaHours} h.</strong>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {STATUS_IDS.map((id) => {
          const n = data ? (id === "all" ? data.counts.open + data.counts.in_progress + data.counts.resolved + data.counts.closed : data.counts[id]) : null
          return (
            <button
              key={id}
              type="button"
              aria-pressed={status === id}
              onClick={() => reset(setStatus)(id)}
              className="rounded-full px-4 py-1.5 text-sm font-medium"
              style={{
                background: status === id ? "var(--accent)" : "var(--bg-surface)",
                color: status === id ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              {STATUS_NAMES[id]}{n !== null ? ` (${n})` : ""}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Asunto, mensaje, nombre o correo…" label="Buscar en los tickets" />
        <FilterSelect label="Filtrar por tema" value={category} onChange={reset(setCategory)} options={[{ id: "all", label: "Todos los temas" }, ...TICKET_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))]} />
        <FilterSelect label="Filtrar por antigüedad" value={age} onChange={reset(setAge)} options={AGE_OPTIONS} />
        <FilterSelect label="Orden" value={oldestFirst ? "old" : "new"} onChange={(v) => reset(setOldestFirst)(v === "old")} options={[{ id: "old", label: "Más antiguos primero" }, { id: "new", label: "Más recientes primero" }]} />
      </div>

      {error && !data ? (
        <ErrorState title="No pudimos cargar los tickets" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando tickets…" />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          title={filtered || status !== "open" ? "No hay tickets con estos filtros" : "Bandeja al día"}
          description={filtered || status !== "open" ? "Prueba con otro estado o quita algún filtro." : "No hay mensajes esperando respuesta."}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {(data?.data ?? []).map((t) => {
            const sla = slaState(t, data!.slaHours)
            return (
              <li key={t.id}>
                <button type="button" onClick={() => setOpenId(t.id)} className="console-row w-full text-left px-4 py-3.5 flex flex-col gap-1">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs console-muted">
                      {t.ticketNo} · {TICKET_CATEGORIES.find((c) => c.id === t.category)?.label ?? "Otro"} · {fmtDate(t.createdAt, "short")}
                    </span>
                    <TicketStatusBadge status={t.status} />
                  </span>
                  <span className="text-sm font-semibold console-title">{t.subject}</span>
                  <span className="text-sm console-muted line-clamp-2">{t.message}</span>
                  <span className="flex flex-wrap items-center gap-x-3 text-xs console-muted">
                    <span>{t.name}{t.organizationName ? ` · ${t.organizationName}` : ""}</span>
                    <span style={{ color: SLA_COLOR[sla.tone] }} className="font-medium">{sla.label}</span>
                    {t.replies > 0 && <span>{t.replies} {t.replies === 1 ? "respuesta enviada" : "respuestas enviadas"}</span>}
                    {t.internalNote && <span>Con nota interna</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {data && <Pager offset={offset} limit={PAGE} total={data.total} onChange={setOffset} />}

      <TicketDetailModal id={openId} onClose={() => setOpenId(null)} onChanged={() => mutate()} />
    </div>
  )
}

export default function SoportePlataformaPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  )
}

"use client"

import { useCallback } from "react"
import useSWR from "swr"
import { Activity, X } from "lucide-react"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Table, { type Column } from "@/components/ui/Table"
import StatusPill from "@/components/plataforma/StatusPill"
import { Pagination, SearchBox } from "@/components/plataforma/clientes/ListControls"
import { useUrlFilters } from "@/components/plataforma/clientes/useUrlFilters"
import {
  ACTIVITY_PERIODS, activityToUrl, listAccessActivity, parseActivityFilters, resultInfo, type ActivityEvent, type ActivityFilters,
} from "@/lib/plataforma/accesos"
import { exactTime, relativeTime } from "@/lib/plataforma/auditView"
import { moduleLabel, usageActionLabel, USAGE_ACTION_LABELS, USAGE_MODULE_LABELS } from "@/lib/plataforma/labels"

const LIMIT = 30

const PERIOD_LABELS: Record<number, string> = { 1: "Último día", 7: "Últimos 7 días", 30: "Últimos 30 días", 90: "Últimos 90 días" }

export default function ActivityFeedTab({ onOpenUser }: { onOpenUser: (userId: string) => void }) {
  // La pestaña activa viaja en la URL junto con los filtros.
  const serialize = useCallback((f: ActivityFilters) => {
    const p = new URLSearchParams(activityToUrl(f))
    p.set("vista", "actividad")
    return p.toString()
  }, [])
  const [filters, setFilters] = useUrlFilters(parseActivityFilters, serialize)
  const { data, error, isLoading, mutate } = useSWR(["accesos-actividad", activityToUrl(filters)], () => listAccessActivity(filters, LIMIT), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const change = (patch: Partial<ActivityFilters>) => setFilters({ ...filters, ...patch, page: 1 })

  const groups: FilterGroup[] = [
    {
      id: "module",
      label: "Módulo",
      value: filters.module,
      onChange: (module) => change({ module }),
      options: Object.entries(USAGE_MODULE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      id: "action",
      label: "Qué hizo",
      value: filters.action,
      onChange: (action) => change({ action }),
      options: Object.entries(USAGE_ACTION_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      id: "result",
      label: "Resultado",
      value: filters.result,
      onChange: (result) => change({ result: result as ActivityFilters["result"] }),
      options: [
        { value: "ok", label: "Correcto" },
        { value: "blocked", label: "Bloqueado por plan o límite" },
        { value: "error", label: "No se pudo completar" },
      ],
    },
    {
      id: "days",
      label: "Periodo",
      value: filters.days !== 7 ? String(filters.days) : undefined,
      onChange: (v) => change({ days: v ? Number(v) : 7 }),
      options: ACTIVITY_PERIODS.filter((d) => d !== 7).map((d) => ({ value: String(d), label: PERIOD_LABELS[d] ?? `${d} días` })),
    },
  ]

  const columns: Column[] = [
    {
      key: "at",
      header: "Cuándo",
      render: (_v, row) => {
        const e = row as unknown as ActivityEvent
        return e.at ? (
          <div>
            <p className="text-sm console-title">{relativeTime(e.at)}</p>
            <p className="text-xs console-muted">{exactTime(e.at)}</p>
          </div>
        ) : "—"
      },
    },
    {
      key: "userName",
      header: "Persona",
      render: (_v, row) => {
        const e = row as unknown as ActivityEvent
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold console-title">{e.userName ?? "Cuenta eliminada"}</p>
            {e.userEmail && <p className="truncate text-xs console-muted">{e.userEmail}</p>}
          </div>
        )
      },
    },
    {
      key: "action",
      header: "Qué hizo",
      render: (_v, row) => {
        const e = row as unknown as ActivityEvent
        return <span className="text-sm console-title">{usageActionLabel(e.action)} <span className="console-muted">en</span> {moduleLabel(e.module)}</span>
      },
    },
    { key: "organizationName", header: "Negocio", render: (v) => (v as string | null) ?? <span className="console-muted">—</span> },
    {
      key: "status",
      header: "Resultado",
      render: (_v, row) => {
        const r = resultInfo((row as unknown as ActivityEvent).status)
        return <StatusPill tone={r.tone}>{r.label}</StatusPill>
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={filters.search} onChange={(search) => change({ search })} placeholder="Buscar por persona o negocio…" label="Buscar actividad" />
        <FilterMenu groups={groups} ariaLabel="Filtrar actividad" />
        {filters.userId && (
          <button
            type="button"
            onClick={() => change({ userId: undefined })}
            className="inline-flex items-center gap-1.5 rounded-full px-3 text-sm font-medium"
            style={{ height: 32, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)", cursor: "pointer" }}
          >
            Solo una persona <X size={14} aria-hidden="true" /><span className="sr-only">Quitar el filtro de persona</span>
          </button>
        )}
        <p className="ml-auto text-xs console-muted" role="status">
          {data ? `${data.total.toLocaleString("es-CO")} movimientos · ${PERIOD_LABELS[filters.days] ?? "Todo el historial"}` : ""}
        </p>
      </div>
      <ActiveFilterChips groups={groups} />

      {error && !data ? (
        <ErrorState title="No pudimos cargar la actividad" onRetry={() => void mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando actividad…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            onRowClick={(row) => { if (row.userId) onOpenUser(row.userId as string) }}
            emptyState={
              <EmptyState
                icon={<Activity size={32} aria-hidden="true" />}
                title="Sin actividad en este periodo"
                description="Cuando alguien use los módulos aparecerá aquí. Prueba con un periodo más amplio o quita algún filtro."
              />
            }
          />
          <Pagination page={filters.page} total={data?.total ?? 0} limit={LIMIT} onPage={(page) => setFilters({ ...filters, page })} />
        </>
      )}
    </div>
  )
}

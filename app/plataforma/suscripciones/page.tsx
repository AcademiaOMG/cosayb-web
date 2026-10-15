"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Download } from "lucide-react"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Table, { type Column } from "@/components/ui/Table"
import { SubscriptionStatusBadge } from "@/components/saas/StatusBadge"
import { DateRange, FilterSelect, Pager, SearchBox, SortControl, useDebounced } from "@/components/plataforma/negocio/ListControls"
import SubscriptionDetailModal from "@/components/plataforma/negocio/SubscriptionDetailModal"
import {
  downloadCsv, fetchAll, methodWithCard, negocioApi, subscriptionCsv, subscriptionStatus, todayStamp, METHOD_LABELS,
  type SortOrder, type SubscriptionRow,
} from "@/lib/plataforma/negocio"
import { SUB_STATUS_TO_API } from "@/lib/saas/adapters"
import { STATUS_LABELS, planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { saasErrorMessage } from "@/lib/saas/services"
import type { PlanId, SubscriptionStatus } from "@/lib/saas/types"
import { toast } from "@/lib/toast"

const PAGE = 25
const STATUSES = ["active", "past_due", "canceled", "pending"] as const satisfies readonly SubscriptionStatus[]

const SORTS = [
  { id: "createdAt", label: "fecha de alta" },
  { id: "amount", label: "importe" },
  { id: "organization", label: "negocio" },
  { id: "currentPeriodEnd", label: "fin del periodo" },
  { id: "status", label: "estado" },
]

function Content() {
  const params = useSearchParams()
  const initialStatus = params.get("status")
  const [status, setStatus] = useState<string>(STATUSES.includes(initialStatus as never) ? initialStatus! : "all")
  const [plan, setPlan] = useState("all")
  const [method, setMethod] = useState("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("createdAt")
  const [order, setOrder] = useState<SortOrder>("desc")
  const [offset, setOffset] = useState(0)
  const [openId, setOpenId] = useState<string | null>(params.get("abrir"))
  const [exporting, setExporting] = useState(false)
  const term = useDebounced(search)

  const filters = {
    search: term || undefined,
    status: status === "all" ? undefined : SUB_STATUS_TO_API[status as SubscriptionStatus],
    plan: plan === "all" ? undefined : plan,
    method: method === "all" ? undefined : method,
    from: from || undefined,
    to: to || undefined,
    sort,
    order,
  }
  const { data, error, isLoading, mutate } = useSWR(["negocio-subs", filters, offset], () => negocioApi.suscripciones({ ...filters, limit: PAGE, offset }), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setOffset(0)
  }
  const filtered = status !== "all" || plan !== "all" || method !== "all" || !!from || !!to || !!term

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = await fetchAll((o, l) => negocioApi.suscripciones({ ...filters, limit: l, offset: o }))
      downloadCsv(`suscripciones-${todayStamp()}.csv`, subscriptionCsv(rows))
      toast.success(`Se descargaron ${rows.length} suscripciones`)
    } catch (err) {
      toast.error("No se pudo exportar", { description: saasErrorMessage(err) })
    } finally {
      setExporting(false)
    }
  }

  const columns: Column[] = [
    {
      key: "organizationName",
      header: "Negocio",
      render: (_v, r) => {
        const s = r as unknown as SubscriptionRow
        return (
          <span className="flex flex-col">
            <span className="font-semibold console-title">{s.organizationName}</span>
            <span className="text-xs console-muted">{s.userEmail}</span>
          </span>
        )
      },
    },
    { key: "plan", header: "Plan", render: (v) => planLabel(v as PlanId) },
    { key: "amount", header: "Importe mensual", render: (v) => formatCOP(Number(v)) },
    {
      key: "status",
      header: "Estado",
      render: (_v, r) => {
        const s = r as unknown as SubscriptionRow
        return <SubscriptionStatusBadge status={subscriptionStatus(s.status)} />
      },
    },
    {
      key: "currentPeriodEnd",
      header: "Próximo cobro",
      render: (_v, r) => {
        const s = r as unknown as SubscriptionRow
        if (!s.currentPeriodEnd) return "—"
        return s.cancelAtPeriodEnd ? `Termina el ${fmtDate(s.currentPeriodEnd, "short")}` : fmtDate(s.currentPeriodEnd, "short")
      },
    },
    { key: "method", header: "Método de pago", render: (_v, r) => { const s = r as unknown as SubscriptionRow; return methodWithCard(s.method, s.cardLast4) } },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold console-title">Suscripciones</h1>
          <p className="text-sm console-muted mt-1">
            {data ? `${data.total} ${data.total === 1 ? "suscripción" : "suscripciones"}${filtered ? " con estos filtros" : ""}` : "Cargando…"}
          </p>
        </div>
        <Button variant="ghost" size="sm" loading={exporting} disabled={!data || data.total === 0} onClick={exportCsv}>
          <Download size={14} aria-hidden="true" /> Descargar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Negocio, cliente o correo…" label="Buscar por negocio, cliente o correo" />
        <FilterSelect label="Filtrar por estado" value={status} onChange={reset(setStatus)} options={[{ id: "all", label: "Todos los estados" }, ...STATUSES.map((s) => ({ id: s, label: STATUS_LABELS[s] }))]} />
        <FilterSelect label="Filtrar por plan" value={plan} onChange={reset(setPlan)} options={[{ id: "all", label: "Todos los planes" }, { id: "pro", label: planLabel("pro") }, { id: "academia", label: planLabel("academia") }]} />
        <FilterSelect label="Filtrar por método de pago" value={method} onChange={reset(setMethod)} options={[{ id: "all", label: "Todos los métodos" }, ...Object.entries(METHOD_LABELS).map(([id, label]) => ({ id, label }))]} />
        <DateRange from={from} to={to} onFrom={reset(setFrom)} onTo={reset(setTo)} />
        <SortControl options={SORTS} sort={sort} order={order} onChange={(s, o) => { setSort(s); setOrder(o); setOffset(0) }} />
      </div>

      {error && !data ? (
        <ErrorState title="No pudimos cargar las suscripciones" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando suscripciones…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            onRowClick={(r) => setOpenId(String(r.id))}
            emptyState={
              <EmptyState
                title={filtered ? "Ninguna suscripción coincide" : "Aún no hay suscripciones"}
                description={filtered ? "Prueba quitando algún filtro o buscando con otras palabras." : "Aparecerán aquí cuando un negocio contrate un plan de pago."}
              />
            }
          />
          {data && <Pager offset={offset} limit={PAGE} total={data.total} onChange={setOffset} />}
        </>
      )}

      <SubscriptionDetailModal id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

export default function SuscripcionesPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  )
}

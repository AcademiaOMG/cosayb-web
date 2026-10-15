"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Download } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Table, { type Column } from "@/components/ui/Table"
import { DateRange, FilterSelect, Pager, SearchBox, SortControl, useDebounced } from "@/components/plataforma/negocio/ListControls"
import PaymentDetailModal from "@/components/plataforma/negocio/PaymentDetailModal"
import {
  PAYMENT_KIND_LABELS, PAYMENT_STATUS_ES, METHOD_LABELS, downloadCsv, failureReasonLabel, fetchAll, methodWithCard, negocioApi,
  paymentCsv, paymentKindLabel, todayStamp, type PaymentRow, type SortOrder,
} from "@/lib/plataforma/negocio"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { saasErrorMessage } from "@/lib/saas/services"
import { toast } from "@/lib/toast"

const PAGE = 25
// Enlaces del resumen usan estos nombres cortos
const STATUS_FROM_URL: Record<string, string> = { failed: "FAILED", paid: "APPROVED", pending: "PENDING" }
const SORTS = [
  { id: "createdAt", label: "fecha" },
  { id: "amount", label: "importe" },
  { id: "organization", label: "negocio" },
  { id: "status", label: "resultado" },
]

function Content() {
  const params = useSearchParams()
  const [status, setStatus] = useState<string>(STATUS_FROM_URL[params.get("status") ?? ""] ?? "all")
  const [method, setMethod] = useState("all")
  const [kind, setKind] = useState("all")
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
    status: status === "all" ? undefined : status,
    method: method === "all" ? undefined : method,
    kind: kind === "all" ? undefined : kind,
    from: from || undefined,
    to: to || undefined,
    sort,
    order,
  }
  const { data, error, isLoading, mutate } = useSWR(["negocio-pagos", filters, offset], () => negocioApi.pagos({ ...filters, limit: PAGE, offset }), {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setOffset(0)
  }
  const filtered = status !== "all" || method !== "all" || kind !== "all" || !!from || !!to || !!term

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = await fetchAll((o, l) => negocioApi.pagos({ ...filters, limit: l, offset: o }))
      downloadCsv(`pagos-${todayStamp()}.csv`, paymentCsv(rows))
      toast.success(`Se descargaron ${rows.length} pagos`)
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
        const p = r as unknown as PaymentRow
        return (
          <span className="flex flex-col">
            <span className="font-semibold console-title">{p.organizationName ?? "Negocio eliminado"}</span>
            <span className="text-xs console-muted">{p.userEmail ?? "—"}</span>
          </span>
        )
      },
    },
    { key: "createdAt", header: "Fecha", render: (v) => fmtDate(String(v), "short") },
    { key: "kind", header: "Concepto", render: (v) => paymentKindLabel(String(v)) },
    { key: "method", header: "Método de pago", render: (_v, r) => { const p = r as unknown as PaymentRow; return methodWithCard(p.method, p.cardLast4) } },
    { key: "amount", header: "Importe", render: (v) => formatCOP(Number(v)) },
    {
      key: "status",
      header: "Resultado",
      render: (_v, r) => {
        const p = r as unknown as PaymentRow
        const st = PAYMENT_STATUS_ES[p.status] ?? { label: p.status, tone: "muted" as const }
        return (
          <span className="flex flex-col gap-1 items-start">
            <Badge variant={st.tone}>{st.label}</Badge>
            {p.status === "FAILED" && <span className="text-xs" style={{ color: "#B45309" }}>{failureReasonLabel(p.failureReason)}</span>}
          </span>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold console-title">Pagos</h1>
          <p className="text-sm console-muted mt-1">
            {data
              ? `${data.total} ${data.total === 1 ? "pago" : "pagos"}${filtered ? " con estos filtros" : ""} · ${formatCOP(data.summary.approvedAmount)} cobrados · ${data.summary.failedCount} rechazados`
              : "Cargando…"}
          </p>
        </div>
        <Button variant="ghost" size="sm" loading={exporting} disabled={!data || data.total === 0} onClick={exportCsv}>
          <Download size={14} aria-hidden="true" /> Descargar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={reset(setSearch)} placeholder="Negocio, correo o n.º de operación…" label="Buscar por negocio, correo o número de operación" />
        <FilterSelect
          label="Filtrar por resultado"
          value={status}
          onChange={reset(setStatus)}
          options={[
            { id: "all", label: "Todos los resultados" },
            { id: "APPROVED", label: "Aprobados" },
            { id: "FAILED", label: "Rechazados" },
            { id: "PENDING", label: "Pendientes" },
            { id: "PROCESSING", label: "En proceso" },
          ]}
        />
        <FilterSelect label="Filtrar por método de pago" value={method} onChange={reset(setMethod)} options={[{ id: "all", label: "Todos los métodos" }, ...Object.entries(METHOD_LABELS).map(([id, label]) => ({ id, label }))]} />
        <FilterSelect label="Filtrar por concepto" value={kind} onChange={reset(setKind)} options={[{ id: "all", label: "Todos los conceptos" }, ...Object.entries(PAYMENT_KIND_LABELS).map(([id, label]) => ({ id, label }))]} />
        <DateRange from={from} to={to} onFrom={reset(setFrom)} onTo={reset(setTo)} />
        <SortControl options={SORTS} sort={sort} order={order} onChange={(s, o) => { setSort(s); setOrder(o); setOffset(0) }} />
      </div>

      {error && !data ? (
        <ErrorState title="No pudimos cargar los pagos" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <LoadingBlock label="Cargando pagos…" />
      ) : (
        <>
          <Table
            columns={columns}
            data={(data?.data ?? []) as unknown as Record<string, unknown>[]}
            rowKey="id"
            onRowClick={(r) => setOpenId(String(r.id))}
            emptyState={
              <EmptyState
                title={filtered ? "Ningún pago coincide" : "Aún no hay pagos"}
                description={filtered ? "Prueba quitando algún filtro o buscando con otras palabras." : "Los cobros de las suscripciones aparecerán aquí."}
              />
            }
          />
          {data && <Pager offset={offset} limit={PAGE} total={data.total} onChange={setOffset} />}
        </>
      )}

      <PaymentDetailModal id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

export default function PagosPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  )
}

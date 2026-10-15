"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import { PaymentStatusBadge } from "@/components/saas/StatusBadge"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { saas } from "@/lib/saas/services"
import type { PaymentStatus } from "@/lib/saas/types"

const STATUS_OPTIONS: { id: PaymentStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos los estados" },
  { id: "paid", label: "Pagados" },
  { id: "failed", label: "Fallidos" },
  { id: "pending", label: "Pendientes" },
]

export default function PagosPage() {
  const [status, setStatus] = useState<PaymentStatus | "all">("all")
  const [search, setSearch] = useState("")
  const { data, error, isLoading, mutate } = useSWR(
    ["platform-payments", status, search],
    () => saas.platform.payments({ status, search }),
    { revalidateOnFocus: false },
  )
  const total = (data ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Pagos</h1>
        <p className="text-sm console-muted mt-1">
          {data ? `${data.length} pagos · ${formatCOP(total)} cobrados en esta vista` : "Cargando…"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative" style={{ width: 280 }}>
          <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="search"
            placeholder="Organización o factura…"
            aria-label="Buscar por organización o factura"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="console-input w-full text-sm"
            style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
          />
        </div>
        <select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus | "all")} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }}>
          {STATUS_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState title="No pudimos cargar los pagos" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="animate-pulse console-row" style={{ height: 62 }} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(data ?? []).map((p) => (
            <div key={p.id} className="console-row flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5">
              <div className="flex-1 min-w-[160px]">
                <p className="text-sm font-semibold console-title truncate">{p.organizationName}</p>
                <p className="text-xs console-muted mt-0.5">{p.invoiceNumber} · {fmtDate(p.createdAt, "short")}</p>
              </div>
              <span className="text-sm console-muted w-32 truncate">{p.method}</span>
              <span className="text-sm font-medium console-title w-28">{formatCOP(p.amount)}</span>
              <PaymentStatusBadge status={p.status} />
            </div>
          ))}
          {data && data.length === 0 && <p className="text-sm text-center py-10 console-muted">Sin resultados.</p>}
        </div>
      )}
    </div>
  )
}

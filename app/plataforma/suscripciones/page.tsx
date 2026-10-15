"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { ChevronRight, Search } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import { SubscriptionStatusBadge } from "@/components/saas/StatusBadge"
import { STATUS_LABELS, planLabel } from "@/lib/saas/billing"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { saas } from "@/lib/saas/services"
import type { PlanId, SubscriptionStatus } from "@/lib/saas/types"

const STATUSES = Object.keys(STATUS_LABELS) as SubscriptionStatus[]
const PLANS: PlanId[] = ["free", "pro", "academia"]

function Content() {
  const params = useSearchParams()
  const initial = params.get("status") as SubscriptionStatus | null
  const [status, setStatus] = useState<SubscriptionStatus | "all">(initial && STATUSES.includes(initial) ? initial : "all")
  const [plan, setPlan] = useState<PlanId | "all">("all")
  const [search, setSearch] = useState("")

  const { data, error, isLoading, mutate } = useSWR(
    ["platform-subs", status, plan, search],
    () => saas.platform.subscriptions({ status, plan, search }),
    { revalidateOnFocus: false },
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Suscripciones</h1>
        <p className="text-sm console-muted mt-1">{data ? `${data.length} resultados` : "Cargando…"}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative" style={{ width: 280 }}>
          <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="search"
            placeholder="Buscar organización…"
            aria-label="Buscar organización"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="console-input w-full text-sm"
            style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
          />
        </div>
        <select aria-label="Filtrar por estado" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus | "all")} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }}>
          <option value="all">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select aria-label="Filtrar por plan" value={plan} onChange={(e) => setPlan(e.target.value as PlanId | "all")} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }}>
          <option value="all">Todos los planes</option>
          {PLANS.map((p) => <option key={p} value={p}>{planLabel(p)}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState title="No pudimos cargar las suscripciones" onRetry={() => mutate()} />
      ) : isLoading && !data ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="animate-pulse console-row" style={{ height: 62 }} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(data ?? []).map((s) => (
            <Link key={s.id} href={`/plataforma/organizaciones/${s.organizationId}`}>
              <div className="console-row flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-semibold console-title truncate">{s.organizationName}</p>
                  <p className="text-xs console-muted mt-0.5">
                    {s.currentPeriodEnd ? `${s.cancelAtPeriodEnd ? "Termina" : "Renueva"} el ${fmtDate(s.currentPeriodEnd, "short")}` : `Alta ${fmtDate(s.createdAt, "short")}`}
                  </p>
                </div>
                <span className="text-sm console-muted w-24">{planLabel(s.plan)}</span>
                <span className="text-sm font-medium console-title w-28">{s.amount ? formatCOP(s.amount) : "—"}</span>
                <SubscriptionStatusBadge status={s.status} />
                <ChevronRight size={16} className="console-muted" aria-hidden="true" />
              </div>
            </Link>
          ))}
          {data && data.length === 0 && <p className="text-sm text-center py-10 console-muted">Sin resultados.</p>}
        </div>
      )}
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

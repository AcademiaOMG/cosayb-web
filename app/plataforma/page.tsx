"use client"

import useSWR from "swr"
import { platformGetMetrics } from "@/lib/api"
import { Building2, Users, CreditCard } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import DailyBarChart from "@/components/saas/DailyBarChart"
import ErrorState from "@/components/ui/ErrorState"
import { fmtDay, formatCOP } from "@/lib/saas/format"
import { saas } from "@/lib/saas/services"
import { SaasError } from "@/lib/saas/types"
import { planLabel } from "@/lib/saas/billing"

/** 403 del API = el rol no tiene el permiso; reintentar no sirve. */
const isForbidden = (err: unknown) => err instanceof SaasError && err.code === "HTTP_403"

export default function MetricasPage() {
  const { data } = useSWR("platform-metrics", () =>
    platformGetMetrics().then((r) => r.data)
  )
  const [days, setDays] = useState(30)
  const { data: saasMetrics, error: saasError, mutate: retrySaas } = useSWR(
    ["platform-saas-metrics", days],
    () => saas.platform.metrics(days),
    { revalidateOnFocus: false },
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Métricas</h1>
        <p className="text-sm console-muted mt-1">Estado global de Cosayb</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">ORGANIZACIONES</p>
          </div>
          <p className="text-4xl font-bold console-title">
            {data?.totalOrganizations ?? "—"}
          </p>
        </div>

        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">USUARIOS</p>
          </div>
          <p className="text-4xl font-bold console-title">
            {data?.totalUsers ?? "—"}
          </p>
        </div>

        <div className="console-card">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} className="console-muted" />
            <p className="text-[11px] font-bold tracking-widest console-muted">POR MEMBRESÍA</p>
          </div>
          <div className="flex flex-col gap-1.5">
            {data?.organizationsByMembership.map((m) => (
              <div key={m.membership} className="flex justify-between items-center text-sm">
                <span className="console-muted capitalize">{m.membership}</span>
                <span className="font-bold console-title">{m.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section aria-labelledby="saas-titulo" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="saas-titulo" className="text-lg font-bold console-title">Ingresos y suscripciones</h2>
            <p className="text-sm console-muted mt-1">MRR, altas y bajas del negocio SaaS</p>
          </div>
          <select
            aria-label="Periodo"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="console-input text-sm"
            style={{ height: 36, paddingInline: 10 }}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
        </div>

        {saasError ? (
          isForbidden(saasError) ? (
            <ErrorState
              title="Tu rol no incluye las métricas de ingresos"
              description="Pide acceso a un administrador de la plataforma si lo necesitas."
            />
          ) : (
            <ErrorState title="No pudimos cargar las métricas de ingresos" onRetry={() => retrySaas()} />
          )
        ) : !saasMetrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="console-card animate-pulse" style={{ height: 92 }} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="MRR" value={formatCOP(saasMetrics.mrr)} hint={`ARR ${formatCOP(saasMetrics.arr)}`} />
              <Kpi label="SUSCRIPCIONES ACTIVAS" value={String(saasMetrics.activeSubscriptions)} hint={`${saasMetrics.activeTrials} pruebas activas`} />
              <Kpi label="ALTAS (REGISTROS)" value={String(saasMetrics.newSignups)} hint={`${saasMetrics.newOrganizations} organizaciones nuevas`} />
              <Kpi label="BAJAS" value={String(saasMetrics.cancellations)} hint={`Churn ${saasMetrics.churnRatePercent.toLocaleString("es-CO")} %`} />
              <Kpi label="INGRESOS DEL PERIODO" value={formatCOP(saasMetrics.revenue)} hint="Pagos aprobados" />
              <Kpi label="MRR EN RIESGO" value={formatCOP(saasMetrics.mrrPastDue)} hint="Con pago pendiente" />
              <Kpi label="CANCELACIÓN PROGRAMADA" value={formatCOP(saasMetrics.mrrPendingCancellation)} hint="MRR que termina al fin del periodo" />
              <Kpi label="TICKETS ABIERTOS" value={String(saasMetrics.openSupportTickets)} hint={`${saasMetrics.failedPayments} pagos fallidos`} />
            </div>

            {saasMetrics.mrrPastDue > 0 && (
              <p className="text-sm console-title" role="status">
                Hay suscripciones con pago pendiente.{" "}
                <Link href="/plataforma/suscripciones?status=past_due" className="console-accent underline">Revisar</Link>
              </p>
            )}

            <div className="console-card flex flex-col gap-3">
              <p className="text-[11px] font-bold tracking-widest console-muted">REGISTROS POR DÍA</p>
              <DailyBarChart
                points={saasMetrics.signupsByDay.map((d) => ({
                  label: fmtDay(d.day, "short"),
                  title: fmtDay(d.day, "long"),
                  value: d.total,
                }))}
                unit="registros"
                caption={`Registros por día, últimos ${saasMetrics.windowDays} días`}
              />
            </div>

            <div className="console-card flex flex-col gap-2">
              <p className="text-[11px] font-bold tracking-widest console-muted">POR PLAN</p>
              {saasMetrics.byPlan.map((p) => (
                <div key={p.plan} className="flex justify-between items-center text-sm">
                  <span className="console-muted">{planLabel(p.plan)} · {p.subscriptions}</span>
                  <span className="font-bold console-title">{formatCOP(p.mrr)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="console-card">
      <p className="text-[11px] font-bold tracking-widest console-muted mb-2">{label}</p>
      <p className="text-2xl font-bold console-title">{value}</p>
      <p className="text-xs console-muted mt-1">{hint}</p>
    </div>
  )
}

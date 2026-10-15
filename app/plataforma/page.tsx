"use client"

import useSWR from "swr"
import { useState } from "react"
import { platformGetMetrics } from "@/lib/api"
import DailyBarChart from "@/components/saas/DailyBarChart"
import ErrorState from "@/components/ui/ErrorState"
import AttentionPanel from "@/components/plataforma/negocio/AttentionPanel"
import KpiCard from "@/components/plataforma/negocio/KpiCard"
import MonthlyChart from "@/components/plataforma/negocio/MonthlyChart"
import { negocioApi } from "@/lib/plataforma/negocio"
import { fmtDay, formatCOP } from "@/lib/saas/format"
import { SaasError } from "@/lib/saas/types"
import { planLabel } from "@/lib/saas/billing"
import type { PlanId } from "@/lib/saas/types"

/** 403 del API = el rol no tiene el permiso; reintentar no sirve. */
const isForbidden = (err: unknown) => err instanceof SaasError && err.code === "HTTP_403"

const pct = (n: number) => `${n.toLocaleString("es-CO")} %`

export default function ResumenPage() {
  const [days, setDays] = useState(30)
  const { data: totals } = useSWR("platform-metrics", () => platformGetMetrics().then((r) => r.data), { shouldRetryOnError: false })
  const { data, error, mutate } = useSWR(["negocio-resumen", days], () => negocioApi.resumen(days), { revalidateOnFocus: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold console-title">Resumen del negocio</h1>
          <p className="text-sm console-muted mt-1">Cómo va CO$AYB y qué necesita tu atención hoy</p>
        </div>
        <label className="flex items-center gap-2 text-sm console-muted">
          Comparar los últimos
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="console-input text-sm"
            style={{ height: 36, paddingInline: 10 }}
          >
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
        </label>
      </div>

      <AttentionPanel />

      <section aria-labelledby="ingresos-titulo" className="flex flex-col gap-4">
        <div>
          <h2 id="ingresos-titulo" className="text-lg font-bold console-title">Ingresos y clientes</h2>
          <p className="text-sm console-muted mt-1">
            {data
              ? `Últimos ${data.windowDays} días, comparados con los ${data.windowDays} días anteriores.`
              : "Cargando las cifras…"}
          </p>
        </div>

        {error ? (
          isForbidden(error) ? (
            <ErrorState
              title="Tu rol no incluye las cifras de ingresos"
              description="Pide acceso a un administrador de la plataforma si lo necesitas."
            />
          ) : (
            <ErrorState title="No pudimos cargar las cifras del negocio" onRetry={() => mutate()} />
          )
        ) : !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="console-card animate-pulse" style={{ height: 150 }} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Ingresos recurrentes (MRR)"
                value={formatCOP(data.kpis.mrr.value)}
                kpi={data.kpis.mrr}
                format={formatCOP}
                hint={`Equivale a ${formatCOP(data.arr)} al año`}
                help="Lo que cobrarías cada mes si todas las suscripciones vivas se renuevan."
              />
              <KpiCard
                label="Dinero cobrado"
                value={formatCOP(data.kpis.revenue.value)}
                kpi={data.kpis.revenue}
                format={formatCOP}
                help="Suma de los pagos aprobados en el periodo."
              />
              <KpiCard
                label="Clientes de pago"
                value={String(data.kpis.activeSubscriptions.value)}
                kpi={data.kpis.activeSubscriptions}
                help="Negocios con una suscripción vigente (incluye los que tienen un cobro pendiente)."
              />
              <KpiCard
                label="Nuevos clientes de pago"
                value={String(data.kpis.newSubscriptions.value)}
                kpi={data.kpis.newSubscriptions}
                help="Negocios que hicieron su primer pago en el periodo."
              />
              <KpiCard
                label="Bajas"
                value={String(data.kpis.cancellations.value)}
                kpi={data.kpis.cancellations}
                higherIsBetter={false}
                help="Suscripciones que se cancelaron en el periodo."
              />
              <KpiCard
                label="Tasa de cancelación"
                value={pct(data.kpis.churnPercent.value)}
                kpi={data.kpis.churnPercent}
                higherIsBetter={false}
                format={pct}
                help="De cada 100 clientes de pago, cuántos se fueron en el periodo. Más baja es mejor."
              />
              <KpiCard
                label="Pagos rechazados"
                value={String(data.kpis.failedPayments.value)}
                kpi={data.kpis.failedPayments}
                higherIsBetter={false}
                hint={data.mrrPastDue > 0 ? `${formatCOP(data.mrrPastDue)} al mes en riesgo` : undefined}
                help="Cobros que el banco o la pasarela no aceptó."
              />
              <KpiCard
                label="Registros nuevos"
                value={String(data.kpis.newSignups.value)}
                kpi={data.kpis.newSignups}
                hint={`${data.newOrganizations} negocios creados`}
                help="Personas que crearon una cuenta en el periodo."
              />
            </div>

            {data.mrrPendingCancellation > 0 && (
              <p className="text-sm console-title" role="status">
                {formatCOP(data.mrrPendingCancellation)} al mes dejará de cobrarse porque hay cancelaciones programadas.
              </p>
            )}

            <div className="console-card flex flex-col gap-3">
              <div>
                <h3 className="text-base font-bold console-title">Evolución mes a mes</h3>
                <p className="text-xs console-muted">Últimos 12 meses. Se calcula con las suscripciones y los pagos aprobados.</p>
              </div>
              <MonthlyChart points={data.monthly} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="console-card flex flex-col gap-3">
                <h3 className="text-base font-bold console-title">Registros por día</h3>
                {data.signupsByDay.length === 0 ? (
                  <p className="text-sm console-muted">Nadie se registró en este periodo.</p>
                ) : (
                  <DailyBarChart
                    points={data.signupsByDay.map((d) => ({ label: fmtDay(d.day, "short"), title: fmtDay(d.day, "long"), value: d.total }))}
                    unit="registros"
                    caption={`Registros por día, últimos ${data.windowDays} días`}
                  />
                )}
              </div>

              <div className="console-card flex flex-col gap-2">
                <h3 className="text-base font-bold console-title">Clientes por plan</h3>
                {data.byPlan.length === 0 ? (
                  <p className="text-sm console-muted">Aún no hay clientes de pago.</p>
                ) : (
                  data.byPlan.map((p) => (
                    <div key={p.plan} className="flex justify-between items-center text-sm">
                      <span className="console-muted">{planLabel(p.plan as PlanId)} · {p.subscriptions}</span>
                      <span className="font-bold console-title">{formatCOP(p.mrr)} al mes</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {totals && (
        <section aria-labelledby="plataforma-titulo" className="flex flex-col gap-3">
          <h2 id="plataforma-titulo" className="text-lg font-bold console-title">La plataforma en números</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="console-card">
              <p className="text-sm font-semibold console-muted">Negocios</p>
              <p className="text-3xl font-bold console-title">{totals.totalOrganizations}</p>
            </div>
            <div className="console-card">
              <p className="text-sm font-semibold console-muted">Usuarios</p>
              <p className="text-3xl font-bold console-title">{totals.totalUsers}</p>
            </div>
            <div className="console-card flex flex-col gap-1.5">
              <p className="text-sm font-semibold console-muted">Negocios por plan</p>
              {totals.organizationsByMembership.map((m) => (
                <div key={m.membership} className="flex justify-between text-sm">
                  <span className="console-muted">{planLabel(m.membership as PlanId)}</span>
                  <span className="font-bold console-title">{m.total}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

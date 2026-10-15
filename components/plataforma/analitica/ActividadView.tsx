"use client"

import useSWR from "swr"
import DailyBarChart from "@/components/saas/DailyBarChart"
import EmptyState from "@/components/ui/EmptyState"
import KpiCard from "@/components/plataforma/negocio/KpiCard"
import { AsyncBlock, HistoryNotice, Section } from "./Shared"
import { analiticaApi, canCompare, fmtNumber, fmtPercent, type Actividad, type AnalyticsKpi } from "@/lib/plataforma/analitica"
import { fmtDay } from "@/lib/saas/format"

export default function ActividadView({ days }: { days: number }) {
  const { data, error, mutate } = useSWR(["an-actividad", days], () => analiticaApi.actividad(days), { revalidateOnFocus: false })
  return (
    <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="la actividad">
      {(d) => <Contenido d={d} />}
    </AsyncBlock>
  )
}

function Contenido({ d }: { d: Actividad }) {
  if (!d.capture.startedAt) {
    return (
      <div className="flex flex-col gap-4">
        <HistoryNotice capture={d.capture} />
        <EmptyState title="Aún no hay actividad que mostrar" description="Cuando los clientes usen el producto, aquí verás cuántas personas y negocios están activos." />
      </div>
    )
  }
  const cmp = canCompare(d.capture, d.days)
  const k = d.kpis
  const kp = (x: AnalyticsKpi) => (cmp ? x : undefined)
  const points = (pick: (p: Actividad["series"][number]) => number) =>
    d.series.map((p) => ({ label: fmtDay(p.date), title: fmtDay(p.date, "long"), value: pick(p) }))
  const comparado = cmp ? `, comparado con los ${d.days} días anteriores` : ""
  const intro = `Del ${fmtDay(d.period.from)} al ${fmtDay(d.period.to)}${comparado}. En total hay ${d.base.users} cuentas de clientes y ${d.base.organizations} negocios activos.`

  return (
    <div className="flex flex-col gap-8">
      <HistoryNotice capture={d.capture} />
      <Section
        id="act-cifras"
        title="Quién está usando CO$AYB"
        intro={intro}
        explain="Una persona o negocio está activo si hizo al menos una acción (consultar, crear, modificar, eliminar o exportar) en el periodo. Los intentos bloqueados por el plan no cuentan como uso. Se excluye al equipo de la plataforma. Los días van de medianoche a medianoche, hora de Colombia."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Personas activas" value={fmtNumber(k.activeUsers.value)} kpi={kp(k.activeUsers)} help="Personas distintas que usaron el producto al menos una vez en el periodo." />
          <KpiCard label="Negocios activos" value={fmtNumber(k.activeOrganizations.value)} kpi={kp(k.activeOrganizations)} help="Negocios en los que alguien hizo al menos una acción en el periodo." />
          <KpiCard label="Acciones realizadas" value={fmtNumber(k.actions.value)} kpi={kp(k.actions)} help="Todo lo que se consultó, creó, modificó, eliminó o exportó en el periodo." />
          <KpiCard
            label="Pegajosidad"
            value={fmtPercent(k.stickiness.value)}
            kpi={kp(k.stickiness)}
            format={fmtPercent}
            help="De las personas activas en el mes, qué porcentaje entra en un día cualquiera. Más alto = hábito de uso."
          />
          <KpiCard label="Activas por día (promedio)" value={fmtNumber(k.dau.value)} kpi={kp(k.dau)} format={fmtNumber} help="Promedio de personas distintas por día durante los últimos 30 días (los días sin uso cuentan 0)." />
          <KpiCard label="Activas en la semana" value={fmtNumber(k.wau.value)} kpi={kp(k.wau)} help="Personas distintas que usaron el producto en los últimos 7 días." />
          <KpiCard label="Activas en el mes" value={fmtNumber(k.mau.value)} kpi={kp(k.mau)} help="Personas distintas que usaron el producto en los últimos 30 días." />
        </div>
        {!cmp && (
          <p className="text-xs console-muted">
            Todavía no se compara con el periodo anterior: la captura de uso no cubre {d.days * 2} días completos (hay {d.capture.historyDays} de historia).
          </p>
        )}
      </Section>

      <Section
        id="act-serie"
        title="Evolución día a día"
        explain="Una barra por día del periodo. Los fines de semana suelen bajar. Pasa el cursor o usa «Ver como tabla» para leer cada cifra."
      >
        {d.capture.enough ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="console-card flex flex-col gap-2">
              <h3 className="text-base font-bold console-title">Personas activas por día</h3>
              <DailyBarChart points={points((p) => p.users)} unit="personas" caption="Personas activas por día" />
            </div>
            <div className="console-card flex flex-col gap-2">
              <h3 className="text-base font-bold console-title">Acciones por día</h3>
              <DailyBarChart points={points((p) => p.actions)} unit="acciones" caption="Acciones realizadas por día" />
            </div>
          </div>
        ) : (
          <p className="console-card text-sm console-muted">
            Los gráficos aparecen cuando hay al menos 7 días de historia, para no sacar conclusiones de muy pocos datos.
          </p>
        )}
      </Section>
    </div>
  )
}

"use client"

import Link from "next/link"
import useSWR from "swr"
import EmptyState from "@/components/ui/EmptyState"
import StatusPill from "@/components/plataforma/StatusPill"
import { AsyncBlock, HistoryNotice, Section, Th } from "./Shared"
import { analiticaApi, fmtNumber, fmtPercent, type Planes } from "@/lib/plataforma/analitica"
import { membershipLabel, moduleLabel } from "@/lib/plataforma/labels"
import { fmtDate, timeAgoEs } from "@/lib/saas/format"

export default function PlanesView({ days }: { days: number }) {
  const { data, error, mutate } = useSWR(["an-planes", days], () => analiticaApi.planes(days), { revalidateOnFocus: false })
  return (
    <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="el uso por plan">
      {(d) => <Contenido d={d} />}
    </AsyncBlock>
  )
}

const ficha = (id: string) => `/plataforma/organizaciones/${encodeURIComponent(id)}`
const linkCls = "font-semibold underline underline-offset-2 plat-link"

function Contenido({ d }: { d: Planes }) {
  const { limits, trials, averageActionsPerActiveOrganization: avg } = d.signals
  return (
    <div className="flex flex-col gap-8">
      <HistoryNotice capture={d.capture} />

      <Section
        id="plan-uso"
        title="Uso por plan"
        intro={`Últimos ${d.days} días.`}
        explain="Negocios = negocios activos (no suspendidos) de cada plan. Con actividad = los que hicieron al menos una acción en el periodo. Acciones por negocio = acciones totales del plan entre los negocios con actividad."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {d.byPlan.map((p) => (
            <div key={p.plan} className="console-card flex flex-col gap-2">
              <h3 className="text-base font-bold console-title">Plan {membershipLabel(p.plan)}</h3>
              <p className="text-sm console-title">
                <strong>{fmtNumber(p.activeOrganizations)}</strong> de {fmtNumber(p.organizations)} {p.organizations === 1 ? "negocio" : "negocios"} con actividad
                <span className="console-muted"> ({fmtPercent(p.activePercent)})</span>
              </p>
              <p className="text-xs console-muted">
                {fmtNumber(p.users)} {p.users === 1 ? "persona" : "personas"} · {fmtNumber(p.actions)} acciones · {fmtNumber(p.actionsPerActiveOrganization)} por negocio con actividad
              </p>
              <p className="text-xs console-muted">
                {p.topModules.length ? `Lo más usado: ${p.topModules.map((m) => moduleLabel(m.module)).join(", ")}.` : "Sin uso en el periodo."}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="plan-limites"
        title="Negocios gratuitos que chocan con el plan"
        intro="Oportunidades de venta: alguien intentó algo que el plan Free no permite o llegó a su tope."
        explain="Cuenta los intentos bloqueados (el producto respondió «sin permiso» o «demasiadas solicitudes») de negocios en plan Free durante el periodo. Se ordenan de más a menos intentos y, a igualdad, por más actividad. Ojo: un bloqueo también puede deberse al rol de la persona dentro del negocio y no al plan."
      >
        {limits.length === 0 ? (
          <EmptyState title="Ningún negocio gratuito chocó con el plan" description="Aparecerán aquí cuando alguien intente usar algo bloqueado o llegue a un tope." />
        ) : (
          <div className="console-card overflow-x-auto p-0!">
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Negocios gratuitos con intentos bloqueados por el plan, ordenados por número de intentos</caption>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <Th>Negocio</Th><Th>Intentos bloqueados</Th><Th>Dónde chocó</Th><Th>Actividad</Th><Th>Último intento</Th>
                </tr>
              </thead>
              <tbody>
                {limits.map((o) => (
                  <tr key={o.organizationId} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td className="px-3 py-3 align-top"><Link href={ficha(o.organizationId)} className={`${linkCls} console-title`}>{o.name}</Link></td>
                    <td className="px-3 py-3 align-top font-semibold console-title">{fmtNumber(o.hits)}</td>
                    <td className="px-3 py-3 align-top text-xs console-muted">{o.modules.map((m) => `${moduleLabel(m.module)} (${m.hits})`).join(" · ")}</td>
                    <td className="px-3 py-3 align-top text-xs console-muted">{fmtNumber(o.actions)} acciones en {fmtNumber(o.activeDays)} {o.activeDays === 1 ? "día" : "días"}</td>
                    <td className="px-3 py-3 align-top text-xs console-muted whitespace-nowrap">{timeAgoEs(o.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="plan-pruebas"
        title="Pruebas gratuitas que vencen pronto"
        intro={`Negocios Pro cuya prueba termina en los próximos ${d.signals.trialWindowDays} días, de más a menos activos.`}
        explain={`Acciones = lo que hicieron en los últimos ${d.days} días. «Muy activo» = al menos el promedio de acciones por negocio con actividad (${fmtNumber(avg)} en este periodo): son los mejores candidatos para contactar antes de que venza.`}
      >
        {trials.length === 0 ? (
          <EmptyState title="Ninguna prueba vence en los próximos días" />
        ) : (
          <div className="console-card overflow-x-auto p-0!">
            <table className="w-full min-w-[620px] text-sm">
              <caption className="sr-only">Pruebas gratuitas que vencen pronto, con su nivel de actividad</caption>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <Th>Negocio</Th><Th>Vence</Th><Th>Actividad</Th><Th>Nivel</Th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t) => (
                  <tr key={t.organizationId} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td className="px-3 py-3"><Link href={ficha(t.organizationId)} className={`${linkCls} console-title`}>{t.name}</Link></td>
                    <td className="px-3 py-3 text-xs console-muted whitespace-nowrap">
                      {fmtDate(t.trialEndsAt, "short")} · {t.daysLeft <= 1 ? "hoy o mañana" : `en ${t.daysLeft} días`}
                    </td>
                    <td className="px-3 py-3 text-xs console-muted">{fmtNumber(t.actions)} acciones en {fmtNumber(t.activeDays)} {t.activeDays === 1 ? "día" : "días"}</td>
                    <td className="px-3 py-3">
                      {t.highActivity ? <StatusPill tone="success">Muy activo</StatusPill> : t.actions > 0 ? <StatusPill tone="info">Con uso</StatusPill> : <StatusPill tone="neutral">Sin uso</StatusPill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

"use client"

import useSWR from "swr"
import EmptyState from "@/components/ui/EmptyState"
import StatusPill from "@/components/plataforma/StatusPill"
import { AsyncBlock, HistoryNotice, Section, Th } from "./Shared"
import { adoptionText, analiticaApi, barWidth, canCompare, fmtNumber, fmtPercent, trendText, type Modulos, type ModuloUso } from "@/lib/plataforma/analitica"
import { moduleLabel, usageActionLabel } from "@/lib/plataforma/labels"

const ACTIONS = ["view", "create", "update", "delete", "export"] as const

export default function ModulosView({ days }: { days: number }) {
  const { data, error, mutate } = useSWR(["an-modulos", days], () => analiticaApi.modulos(days), { revalidateOnFocus: false })
  return (
    <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="el uso por módulo">
      {(d) => <Contenido d={d} />}
    </AsyncBlock>
  )
}

function Contenido({ d }: { d: Modulos }) {
  if (!d.capture.startedAt) {
    return (
      <div className="flex flex-col gap-4">
        <HistoryNotice capture={d.capture} />
        <EmptyState title="Aún no hay uso por módulo" description="Cuando los clientes usen el producto verás aquí qué módulos prefieren." />
      </div>
    )
  }
  const cmp = canCompare(d.capture, d.days)
  const used = d.modules.filter((m) => m.actions > 0)
  const max = Math.max(...used.map((m) => m.actions), 1)
  const low = d.modules.filter((m) => m.lowAdoption)

  return (
    <div className="flex flex-col gap-8">
      <HistoryNotice capture={d.capture} />
      <Section
        id="mod-ranking"
        title="Módulos más usados"
        intro={`Ordenados por acciones en los últimos ${d.days} días. Hubo ${d.activeOrganizations} ${d.activeOrganizations === 1 ? "negocio activo" : "negocios activos"}.`}
        explain="Acciones = veces que se consultó, creó, modificó, eliminó o exportó algo en ese módulo. Personas y negocios cuentan una sola vez cada uno. La tendencia compara las acciones contra los días anteriores de igual duración; se oculta mientras la captura de uso no cubra ambos periodos."
      >
        {used.length === 0 ? (
          <EmptyState title="Sin uso en este periodo" description="Prueba con un periodo más largo." />
        ) : (
          <div className="console-card overflow-x-auto p-0!">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Módulos del producto ordenados por número de acciones, con personas, negocios, tendencia y desglose por tipo de acción</caption>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <Th>Módulo</Th>
                  <Th>Acciones</Th>
                  <Th>Personas</Th>
                  <Th>Negocios</Th>
                  <Th>Tendencia</Th>
                  <Th>Qué hacen</Th>
                </tr>
              </thead>
              <tbody>
                {used.map((m) => <Fila key={m.module} m={m} max={max} comparable={cmp} />)}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="mod-adopcion"
        title="Módulos con poca adopción"
        intro={`Módulos que usó menos del ${d.lowAdoptionThreshold} % de los negocios activos.`}
        explain={`Adopción = de los negocios que estuvieron activos en el periodo, qué porcentaje ha usado ese módulo alguna vez (en toda la historia, no solo en el periodo). Un porcentaje bajo puede significar que el módulo no se encuentra, no se entiende o no hace falta.`}
      >
        {d.activeOrganizations === 0 ? (
          <p className="console-card text-sm console-muted">No hubo negocios activos en el periodo, así que no se puede medir la adopción.</p>
        ) : (
          <div className="console-card flex flex-col gap-4">
            {low.length === 0 && <p className="text-sm console-muted">Todos los módulos los usa al menos el {d.lowAdoptionThreshold} % de los negocios activos.</p>}
            <ul className="flex flex-col gap-3">
              {[...d.modules].filter((m) => m.module !== "other").sort((a, b) => a.adoptionPercent - b.adoptionPercent).map((m) => (
                <li key={m.module} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold console-title">{moduleLabel(m.module)}</span>
                    <span className="flex items-center gap-2 text-xs console-muted">
                      {adoptionText(m.usedByOrganizations, d.activeOrganizations)} · {fmtPercent(m.adoptionPercent)}
                      {m.lowAdoption && <StatusPill tone="warning">Poca adopción</StatusPill>}
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-2 w-full rounded-full" style={{ background: "var(--bg-secondary)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${m.adoptionPercent}%`, background: m.lowAdoption ? "var(--warning)" : "var(--accent)" }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  )
}

function Fila({ m, max, comparable }: { m: ModuloUso; max: number; comparable: boolean }) {
  const trend = trendText(m.changePercent, comparable)
  const tone = !comparable || m.changePercent === null || m.changePercent === 0 ? "var(--text-muted)" : m.changePercent > 0 ? "#047857" : "#B45309"
  return (
    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
      <td className="px-3 py-3 align-top" style={{ minWidth: 200 }}>
        <p className="font-semibold console-title">{moduleLabel(m.module)}</p>
        <div aria-hidden="true" className="mt-1.5 h-2 rounded-full" style={{ background: "var(--bg-secondary)" }}>
          <div className="h-2 rounded-full" style={{ width: `${barWidth(m.actions, max)}%`, background: "var(--accent)" }} />
        </div>
      </td>
      <td className="px-3 py-3 align-top font-semibold console-title">{fmtNumber(m.actions)}</td>
      <td className="px-3 py-3 align-top console-title">{fmtNumber(m.users)}</td>
      <td className="px-3 py-3 align-top console-title">{fmtNumber(m.organizations)}</td>
      <td className="px-3 py-3 align-top text-xs font-medium whitespace-nowrap" style={{ color: tone }}>
        {trend}
        {comparable && <span className="block font-normal console-muted">antes: {fmtNumber(m.previousActions)}</span>}
      </td>
      <td className="px-3 py-3 align-top text-xs console-muted">
        {ACTIONS.filter((a) => m.byAction[a] > 0).map((a) => `${usageActionLabel(a)} ${fmtNumber(m.byAction[a])}`).join(" · ") || "—"}
      </td>
    </tr>
  )
}

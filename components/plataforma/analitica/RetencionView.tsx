"use client"

import { useState } from "react"
import useSWR from "swr"
import { AsyncBlock, HistoryNotice, PeriodSelect, Section, Th } from "./Shared"
import { analiticaApi, fmtPercent, heatLevel, heatStyle, weekRangeLabel, type Retencion } from "@/lib/plataforma/analitica"

const WEEKS = [
  { value: 8, label: "Últimas 8 semanas" },
  { value: 12, label: "Últimas 12 semanas" },
] as const

const LEGEND = [
  { level: 0, label: "0 %", sample: 0 },
  { level: 1, label: "menos de 10 %", sample: 5 },
  { level: 2, label: "10 a 25 %", sample: 15 },
  { level: 3, label: "25 a 50 %", sample: 35 },
  { level: 4, label: "50 % o más", sample: 70 },
]

export default function RetencionView() {
  const [weeks, setWeeks] = useState(8)
  const { data, error, mutate } = useSWR(["an-retencion", weeks], () => analiticaApi.retencion(weeks), { revalidateOnFocus: false })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PeriodSelect value={weeks} onChange={setWeeks} options={WEEKS} label="Registros de" />
      </div>
      <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="la retención">
        {(d) => <Matriz d={d} />}
      </AsyncBlock>
    </div>
  )
}

function Matriz({ d }: { d: Retencion }) {
  const withUsers = d.cohorts.filter((c) => c.size > 0)
  return (
    <div className="flex flex-col gap-4">
      <HistoryNotice capture={d.capture} />
      <Section
        id="ret-matriz"
        title="¿Vuelven los clientes nuevos?"
        intro="Cada fila son las personas que se registraron en una semana; cada columna, qué porcentaje volvió a usar el producto semanas después."
        explain="Cohorte = personas que crearon su cuenta la misma semana (lunes a domingo, hora de Colombia). «Semana 1» es la semana siguiente a la del registro, y así hasta la 4. El porcentaje es cuántas de esas personas hicieron al menos una acción esa semana. Las celdas con «—» no se pueden medir: la semana es futura, es anterior al inicio de la captura de uso, o la cohorte no tuvo registros. «En curso» indica que la semana aún no termina."
      >
        {withUsers.length === 0 ? (
          <p className="console-card text-sm console-muted">Nadie se registró en estas semanas, así que no hay cohortes que medir.</p>
        ) : (
          <div className="console-card overflow-x-auto p-0!">
            <table className="w-full min-w-[620px] text-sm border-separate" style={{ borderSpacing: 4 }}>
              <caption className="sr-only">Retención por semana de registro: porcentaje de personas que vuelven a usar el producto en las semanas 1 a 4</caption>
              <thead>
                <tr>
                  <Th>Semana de registro</Th>
                  <Th>Personas</Th>
                  {Array.from({ length: d.retentionWeeks }, (_, i) => <Th key={i} className="text-center">Semana {i + 1}</Th>)}
                </tr>
              </thead>
              <tbody>
                {d.cohorts.map((c) => (
                  <tr key={c.week}>
                    <th scope="row" className="px-3 py-2 text-left text-xs font-medium console-title whitespace-nowrap">{weekRangeLabel(c.week)}</th>
                    <td className="px-3 py-2 console-title">{c.size}</td>
                    {c.cells.map((cell) => {
                      const s = heatStyle(cell.percent)
                      const label = cell.percent === null
                        ? "Sin medir"
                        : `${cell.users} de ${c.size} (${fmtPercent(cell.percent)})${cell.partial ? ", semana en curso" : ""}`
                      return (
                        <td
                          key={cell.week}
                          className="rounded-[var(--radius-sm)] px-2 py-2 text-center text-sm font-semibold"
                          style={{ background: s.background, color: s.color, border: cell.percent === null ? "1px dashed var(--border-light)" : undefined }}
                          title={label}
                        >
                          <span className="sr-only">{label}</span>
                          <span aria-hidden="true">
                            {cell.percent === null ? "—" : fmtPercent(cell.percent)}
                            {cell.partial && <span className="block text-[10px] font-normal opacity-90">en curso</span>}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs console-muted" aria-label="Qué significa cada color">
          {LEGEND.map((l) => {
            const s = heatStyle(l.sample)
            return (
              <li key={l.level} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm" style={{ background: heatLevel(l.sample) === 0 ? "var(--bg-secondary)" : s.background, border: "1px solid var(--border-light)" }} />
                {l.label}
              </li>
            )
          })}
        </ul>
      </Section>
    </div>
  )
}

"use client"

import { useState } from "react"
import useSWR from "swr"
import EmptyState from "@/components/ui/EmptyState"
import { AsyncBlock, PeriodSelect, Section } from "./Shared"
import { analiticaApi, fmtNumber, fmtPercent } from "@/lib/plataforma/analitica"
import { funnelStepLabel } from "@/lib/plataforma/labels"

const FUNNEL_PERIODS = [
  { value: 0, label: "Desde siempre" },
  { value: 30, label: "Registrados en 30 días" },
  { value: 90, label: "Registrados en 90 días" },
  { value: 365, label: "Registrados en 1 año" },
] as const

export default function EmbudoView() {
  const [days, setDays] = useState(0)
  const { data, error, mutate } = useSWR(["an-embudo", days], () => analiticaApi.embudo(days), { revalidateOnFocus: false })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PeriodSelect value={days} onChange={setDays} options={FUNNEL_PERIODS} label="Personas" />
      </div>
      <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="el embudo">
        {(d) => {
          const start = d.steps[0]?.count ?? 0
          return (
            <Section
              id="emb-pasos"
              title="De registrarse a pagar"
              intro="Cuántas personas llegan a cada paso, y dónde se quedan."
              explain="Cada paso cuenta solo a quienes completaron también todos los anteriores, por eso nunca crece. Se calcula con los datos del producto (cuentas, negocios, ingredientes, recetas, menús y pagos), no con eventos de uso, así que tiene todo el historial. No incluye a quienes solo fueron invitados al negocio de otra persona. «Pasaron a un plan de pago» significa que tienen al menos un pago de suscripción aprobado."
            >
              {start === 0 ? (
                <EmptyState title="Nadie se registró en este periodo" description="Prueba con «Desde siempre» o un periodo más largo." />
              ) : (
                <ol className="console-card flex flex-col gap-5">
                  {d.steps.map((s, i) => (
                    <li key={s.key} className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-sm font-semibold console-title">{i + 1}. {funnelStepLabel(s.key)}</span>
                        <span className="text-sm console-title">
                          <strong>{fmtNumber(s.count)}</strong>
                          <span className="console-muted"> · {fmtPercent(s.percentOfStart)} de quienes se registraron</span>
                        </span>
                      </div>
                      <div aria-hidden="true" className="h-3 w-full rounded-full" style={{ background: "var(--bg-secondary)" }}>
                        <div className="h-3 rounded-full" style={{ width: `${s.percentOfStart}%`, background: "var(--accent)", minWidth: s.count > 0 ? 6 : 0 }} />
                      </div>
                      {i > 0 && (
                        <p className="text-xs console-muted">
                          {s.lost > 0
                            ? `Se pierden ${fmtNumber(s.lost)} ${s.lost === 1 ? "persona" : "personas"} (${fmtPercent(s.lostPercent)}) respecto al paso anterior; avanzan ${fmtPercent(s.percentOfPrevious)}.`
                            : "No se pierde nadie respecto al paso anterior."}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          )
        }}
      </AsyncBlock>
    </div>
  )
}

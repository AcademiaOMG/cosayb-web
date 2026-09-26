"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Modal from "@/components/ui/Modal"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import type { Valuation } from "@/types/domain"
import { getValuations, getRecipes } from "@/lib/api"
import CalculatorFlow, { type CalculatorPrefill } from "./CalculatorFlow"
import HistoryView from "./HistoryView"
import ValuationViewModal from "./ValuationViewModal"
import type { CalculatorMode } from "./lib"

type Tab = "calculator" | "history"

export default function ValoracionPage() {
  useHelpAvailable()
  const { can, hasFeature, featureLockedMessage } = usePermissions()

  const { data: history = [], isLoading, mutate } = useSWR(
    "valuations",
    () => getValuations().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const { data: availableRecipes = [] } = useSWR(
    "recipes",
    () => getRecipes(undefined, "all", 1, 100).then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [tab, setTab] = useState<Tab>("calculator")
  const [helpOpen, setHelpOpen] = useState(false)
  const [viewingValuation, setViewingValuation] = useState<Valuation | null>(null)
  const [prefill, setPrefill] = useState<CalculatorPrefill | null>(null)
  const [flowKey, setFlowKey] = useState(0)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  function reuseValuation(v: Valuation) {
    const mode: CalculatorMode = "precio-venta"
    setPrefill({
      mode,
      costoMP: parseFloat(v.costMateriaprima),
      pctMP: parseFloat(v.pctMateriaprima),
      margin: parseFloat(v.safetyMargin),
      sourceValuation: v,
    })
    setFlowKey((k) => k + 1)
    setViewingValuation(null)
    setTab("calculator")
  }

  function goToCalculator() {
    setPrefill(null)
    setFlowKey((k) => k + 1)
    setTab("calculator")
  }

  async function handleSaved() {
    await mutate()
    setTab("history")
  }

  if (!hasFeature("module_valuations")) {
    return <ModuleLocked message={featureLockedMessage("module_valuations")} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Valoración de Costos"
        subtitle="Calcula el precio de venta, el % de materia prima o el costo de un plato — como con una calculadora"
        action={
          <div
            className="flex items-center gap-1 p-1"
            style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}
          >
            <button
              onClick={goToCalculator}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderRadius: "var(--radius-sm)",
                ...(tab === "calculator"
                  ? { background: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--text-muted)" }),
              }}
            >
              Calculadora
            </button>
            <button
              onClick={() => setTab("history")}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderRadius: "var(--radius-sm)",
                ...(tab === "history"
                  ? { background: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--text-muted)" }),
              }}
            >
              Historial
            </button>
          </div>
        }
      />

      {tab === "calculator" ? (
        <CalculatorFlow
          key={flowKey}
          availableRecipes={availableRecipes}
          onSaved={handleSaved}
          prefill={prefill}
          onConsumedPrefill={() => setPrefill(null)}
        />
      ) : (
        <HistoryView
          history={history}
          isLoading={isLoading}
          canCreate={can("valuations", "create")}
          onNewCalculation={goToCalculator}
          onView={setViewingValuation}
          onReuse={reuseValuation}
        />
      )}

      <ValuationViewModal
        valuation={viewingValuation}
        onClose={() => setViewingValuation(null)}
        onReuse={reuseValuation}
      />

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Valoración de Costos">
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta calculadora te permite fijar el precio de venta de un plato a partir de su costo de ingredientes — sin necesitar conocimiento previo de la plataforma.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Cómo usarla:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Elige qué calcular:</strong> Precio de venta, % de materia prima o Precio de materia prima — solo te pedimos los dos datos necesarios para ese resultado.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Cargar desde una receta:</strong> Cuando el cálculo necesita el costo de materia prima, puedes seleccionar una receta existente y se llena solo.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Valoración detallada:</strong> Junto al resultado verás el desglose completo — materia prima, costos fijos, impuestos, otros y ganancia — con gráfico.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Guardar en historial:</strong> Una vez tengas el resultado, puedes guardarlo con nombre, notas y precio real de venta para comparar después.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> El indicador MUY BUENO significa que el plato es altamente rentable (menos del 32% son ingredientes).
          </p>
        </div>
      </Modal>
    </div>
  )
}

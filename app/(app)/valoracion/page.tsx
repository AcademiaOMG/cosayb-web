"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Calculator, History } from "lucide-react"
import Modal from "@/components/ui/Modal"
import PageHeader from "@/components/ui/PageHeader"
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
  const { can, hasFeature, featureLockedMessage, isLoading: permsLoading } = usePermissions()

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

  // Mientras cargan los permisos no se sabe si el módulo está habilitado —
  // no mostrar "módulo bloqueado" por un instante a quien sí lo tiene.
  if (permsLoading) return null

  if (!hasFeature("module_valuations")) {
    return <ModuleLocked message={featureLockedMessage("module_valuations")} />
  }

  return (
    // Ancho máximo compartido por ambas pestañas: el título no salta al
    // cambiar de pestaña y, en la calculadora, queda alineado con el aparato.
    <div className="w-full flex flex-col gap-7 pt-1 lg:gap-10 lg:pt-3">
      <PageHeader
        title="Valoración de costos"
        subtitle="Calcula el precio de venta de tus productos"
        action={
          <button
            onClick={tab === "calculator" ? () => setTab("history") : goToCalculator}
            className="flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold shrink-0"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {tab === "calculator" ? (
              <>
                <History size={16} style={{ color: "var(--text-muted)" }} />
                Historial
              </>
            ) : (
              <>
                <Calculator size={16} style={{ color: "var(--text-muted)" }} />
                Calculadora
              </>
            )}
          </button>
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
                <span><strong>Elige qué calcular:</strong> Precio de materia prima, % de materia prima o Precio de venta — solo te pedimos los dos datos necesarios para ese resultado. Cada resultado queda cargado para el cálculo siguiente.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Cargar desde una receta:</strong> Cuando el cálculo necesita el precio de materia prima, elige una receta en <strong>Cargar precio desde una receta</strong> y se llena solo.</span>
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

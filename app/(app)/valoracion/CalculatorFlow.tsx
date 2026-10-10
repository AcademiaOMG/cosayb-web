"use client"

import { useState } from "react"
import "./calculator.css"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { Save } from "lucide-react"
import type { Recipe, Valuation } from "@/types/domain"
import ValuationDetailCard from "./ValuationDetailCard"
import SavePanel from "./SavePanel"
import ModeSwitcher from "./ModeSwitcher"
import ValuationCalculator from "./ValuationCalculator"
import { useValuationCalculator } from "./useValuationCalculator"
import {
  MODE_META,
  nextMode,
  fmt,
  fmtPct,
  type CalculatorMode,
  type SaveFormState,
  EMPTY_SAVE,
  saveFormFromValuation,
} from "./lib"

export interface CalculatorPrefill {
  mode: CalculatorMode
  costoMP: number
  pctMP: number
  margin: number
  sourceValuation: Valuation
}

const PANEL_ID = "valuation-calculator-panel"
const QUESTION_ID = "valuation-question"

/**
 * Composición de la pantalla de cálculo (ver .valuation-* en calculator.css):
 *  - Columna del aparato: selector de modo + calculadora, siempre juntos.
 *  - Columna de la respuesta: la pregunta que responde el modo y, debajo, el
 *    recibo impreso con el desglose. Antes de calcular, la impresora vacía.
 * En angosto todo va en una columna y la respuesta solo aparece con resultado.
 */
export default function CalculatorFlow({
  availableRecipes,
  onSaved,
  prefill,
  onConsumedPrefill,
}: {
  availableRecipes: Recipe[]
  onSaved: () => void
  prefill?: CalculatorPrefill | null
  onConsumedPrefill?: () => void
}) {
  const calc = useValuationCalculator(
    prefill
      ? { mode: prefill.mode, costoMP: prefill.costoMP, pctMP: prefill.pctMP, margin: prefill.margin, autoCalculate: true }
      : {},
  )
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveForm, setSaveForm] = useState<SaveFormState>(
    prefill ? { ...saveFormFromValuation(prefill.sourceValuation), name: "" } : EMPTY_SAVE,
  )

  const result = calc.outcome?.ok ? calc.outcome : null
  const next = nextMode(calc.mode)
  const meta = MODE_META[calc.mode]

  function openSave() {
    if (!saveForm.name && calc.recipe) setSaveForm((f) => ({ ...f, name: calc.recipe!.name }))
    setSaveOpen(true)
  }

  function handleSaved() {
    onConsumedPrefill?.()
    setSaveOpen(false)
    onSaved()
  }

  return (
    <div className="valuation-stage">
      <div className="valuation-workspace">
        <div className="valuation-switch">
          <ModeSwitcher mode={calc.mode} onChange={calc.setMode} panelId={PANEL_ID} />
        </div>

        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-label={meta.title}
          aria-describedby={QUESTION_ID}
          className="valuation-device"
        >
          <ValuationCalculator calc={calc} recipes={availableRecipes} />
        </div>

        <section
          className="valuation-answer"
          data-state={result ? "result" : "idle"}
          aria-labelledby={QUESTION_ID}
        >
          <header className="valuation-question">
            <h2 id={QUESTION_ID} className="valuation-question-title">
              {meta.question}
            </h2>
            <p className="valuation-question-hint">{meta.hint}</p>
          </header>

          {result ? (
            <>
              <ValuationDetailCard
                key={`${result.mode}-${result.value}`}
                result={result.pricing}
                cost={result.costoMP}
                margin={result.margin}
              />

              <div className="valuation-actions">
                <Button variant="primary" size="lg" onClick={openSave}>
                  <Save size={16} aria-hidden />
                  Guardar en historial
                </Button>
                {next && (
                  <Button variant="ghost" size="lg" onClick={() => calc.setMode(next)}>
                    Seguir con {MODE_META[next].title.toLowerCase()}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="calc-printer" aria-hidden>
              <div className="calc-printer-slot" />
              <div className="calc-receipt-placeholder">
                El desglose aparecerá aquí cuando pulses Calcular
              </div>
            </div>
          )}
        </section>
      </div>

      {result && (
        <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Guardar en historial">
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Se guarda el precio sugerido de{" "}
            <strong style={{ color: "var(--text-primary)" }}>{fmt(result.pricing.suggested)}</strong>, con materia
            prima de {fmt(result.costoMP)} ({fmtPct(result.pctMP)}) y margen de seguridad del {fmtPct(result.margin)}.
          </p>
          <SavePanel
            form={saveForm}
            onChange={setSaveForm}
            costMateriaprima={result.costoMP}
            pctMateriaprima={result.pctMP}
            safetyMargin={result.margin}
            recipeId={calc.recipe?.id ?? null}
            onCancel={() => setSaveOpen(false)}
            onSaved={handleSaved}
          />
        </Modal>
      )}
    </div>
  )
}

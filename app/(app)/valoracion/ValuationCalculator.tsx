"use client"

import { useEffect, useRef } from "react"
import { PencilLine } from "lucide-react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import { CalcDevice, CalcDisplay, CalcKeypad, CalcRegister } from "@/components/calculator"
import { entryKeyFromKeyboard, formatMoneyEntry, formatPercentEntry } from "@/lib/calculator/entry"
import type { Recipe } from "@/types/domain"
import { useCountUp } from "./useCountUp"
import { FIELD_META, MODE_META, describeMissing, fmt, type CalculatorMode } from "./lib"
import type { RegisterField, ValuationCalculatorState } from "./useValuationCalculator"

const PERCENT_FIELDS: RegisterField[] = ["pctMP", "margin"]

function formatField(field: RegisterField, raw: string) {
  return PERCENT_FIELDS.includes(field) ? formatPercentEntry(raw) : formatMoneyEntry(raw)
}

function formatResult(mode: CalculatorMode, n: number) {
  return mode === "porcentaje-mp" ? `${n.toFixed(1).replace(".", ",")} %` : fmt(n)
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

// El selector de recetas vive en el formulario, debajo de los campos: se
// viste como un campo más del formulario (superficie clara, borde sutil).
const RECIPE_TRIGGER: React.CSSProperties = {
  height: 46,
  background: "var(--bg-surface)",
  border: "1px solid var(--border-light)",
  borderRadius: "var(--radius-md)",
  color: "var(--text-primary)",
  fontSize: 14,
  padding: "0 14px",
}

/**
 * La calculadora de valoración: card de resultado, cards de resumen con los
 * valores reales, formulario con los datos que el modo necesita (más margen
 * y, si aplica, el selector de recetas), teclado (solo desktop) y Calcular.
 * Recibe el estado de useValuationCalculator, así la misma pieza sirve en
 * cualquier pantalla que necesite valorar un plato.
 */
export default function ValuationCalculator({
  calc,
  recipes,
}: {
  calc: ValuationCalculatorState
  /** Si se pasa, el precio de materia prima se puede cargar desde una receta */
  recipes?: Recipe[]
}) {
  const { mode, outcome, active, values } = calc
  const meta = MODE_META[mode]
  const registerRefs = useRef<Partial<Record<RegisterField, HTMLInputElement | null>>>({})

  const result = outcome?.ok ? outcome : null
  const error = outcome && !outcome.ok ? outcome : null
  const animated = useCountUp(result ? result.value : 0)

  // Teclado físico sin tener que hacer clic en un campo primero: si el foco no
  // está en otro control de texto (ni hay un diálogo abierto), las teclas
  // numéricas van al dato activo, como en una calculadora de escritorio.
  const calcRef = useRef(calc)
  useEffect(() => {
    calcRef.current = calc
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[aria-modal="true"], [role="listbox"]')) return
      const c = calcRef.current
      if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement) && !(e.target as HTMLElement)?.getAttribute?.("role")) {
        e.preventDefault()
        c.calculate()
        return
      }
      const key = entryKeyFromKeyboard(e.key)
      if (!key) return
      e.preventDefault()
      registerRefs.current[c.active]?.focus({ preventScroll: true })
      c.press(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const errorId = "calc-display-message"
  const decimalEnabled = calc.entry[active].decimals
  const resting = !calc.keypadOpen && !!result
  const usesCost = meta.inputs.includes("costoMP")

  // ── Pantalla principal ────────────────────────────────────────────────
  let displayTone: "idle" | "error" | "result" = "idle"
  let displayValue = formatResult(mode, 0)
  let displaySub = calc.missing.length > 0 ? describeMissing(calc.missing) : "Pulsa Calcular"
  let announce = ""
  if (result) {
    displayTone = "result"
    displayValue = formatResult(mode, animated)
    displaySub = ""
    announce = `${meta.title}: ${formatResult(mode, result.value)}`
  } else if (error) {
    displayTone = "error"
    displaySub = error.message
    announce = error.message
  }
  if (calc.recipeStatus === "loading") displaySub = "Calculando el costo de la receta…"
  if (calc.recipeStatus === "error") {
    displayTone = "error"
    displaySub = "No se pudo cargar el costo de esa receta"
  }

  function register(field: RegisterField) {
    const isMargin = field === "margin"
    const label = isMargin ? "Margen de seguridad" : FIELD_META[field].label
    const ariaLabel = isMargin ? "Margen de seguridad (%)" : FIELD_META[field].label
    const hasError = !!error && error.field === field
    return (
      <CalcRegister
        key={field}
        ref={(el) => {
          registerRefs.current[field] = el
        }}
        id={`calc-${field}`}
        label={label}
        ariaLabel={ariaLabel}
        display={formatField(field, values[field])}
        placeholder={PERCENT_FIELDS.includes(field) ? "0 %" : "$ 0"}
        // Móvil: teclado del sistema numérico (montos) o decimal (%).
        inputMode={PERCENT_FIELDS.includes(field) ? "decimal" : "numeric"}
        active={active === field}
        // El valor "fantasma" (la próxima tecla lo reemplaza) solo mientras se
        // edita: con un resultado en pantalla o un costo recién traído de una
        // receta, atenuarlo se leería como "vacío".
        fresh={calc.fresh && !result && !(field === "costoMP" && calc.recipe)}
        error={hasError}
        describedBy={hasError ? errorId : undefined}
        onActivate={() => calc.activate(field)}
        onKey={calc.press}
        onRawInput={(raw) => calc.setRaw(field, raw)}
        onEnter={calc.calculate}
      />
    )
  }

  return (
    <CalcDevice label={`Calculadora de ${meta.title.toLowerCase()}`} className={resting ? "is-resting" : undefined}>
      {/* ── Resultado principal: la variable que despeja el modo ───────── */}
      <CalcDisplay
        label={meta.resultLabel}
        value={displayValue}
        sub={displaySub}
        subId={errorId}
        tone={displayTone}
        announce={announce}
        revealKey={result ? `${mode}-${result.value}` : undefined}
      />

      {/* ── Resumen: dos stats reales, siempre con lo digitado ─────────── */}
      <div className="valuation-summary">
        <div className="valuation-summary-card">
          <span className="valuation-summary-label">{FIELD_META.costoMP.lcd}</span>
          <span className="valuation-summary-value">{formatMoneyEntry(values.costoMP) || "$ 0"}</span>
        </div>
        <div className="valuation-summary-card">
          <span className="valuation-summary-label">Margen de utilidad</span>
          <span className="valuation-summary-value">{formatPercentEntry(values.margin) || "0 %"}</span>
        </div>
      </div>

      {/* ── Formulario: los datos del modo + receta + margen ───────────── */}
      <div className="flex flex-col gap-3">
        {meta.inputs.map(register)}

        {/* Otra forma de llenar el precio de materia prima */}
        {usesCost && recipes && (
          <SearchableSelect
            options={recipes.map((r) => ({ value: r.id, label: r.name }))}
            value={calc.recipe?.id ?? ""}
            onChange={(id) => {
              const r = recipes.find((x) => x.id === id)
              if (r) void calc.loadRecipe({ id: r.id, name: r.name })
            }}
            placeholder="Cargar precio desde una receta"
            searchPlaceholder="Buscar receta"
            emptyMessage="No se encontraron recetas"
            ariaLabel="Cargar el precio de materia prima desde una receta"
            triggerStyle={RECIPE_TRIGGER}
          />
        )}

        {register("margin")}
      </div>

      {/* Teclado numérico — solo desktop; en móvil lo reemplaza el del sistema */}
      <div className="calc-keypad-slot">
        <CalcKeypad onKey={calc.press} onClearAll={calc.clearAll} decimalEnabled={decimalEnabled} />
      </div>

      <button type="button" className="calc-key calc-key-equals" onClick={calc.calculate}>
        Calcular
      </button>

      {/* Con un resultado y poco ancho, el teclado se guarda para que el
          desglose suba; tocar un dato o este botón lo vuelve a abrir. */}
      <button
        type="button"
        className="calc-key calc-key-fn calc-edit-key"
        onClick={() => {
          calc.activate(active)
          registerRefs.current[active]?.focus({ preventScroll: true })
        }}
      >
        <PencilLine size={15} aria-hidden />
        Cambiar datos
      </button>
    </CalcDevice>
  )
}

"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import "./calculator.css"
import Button from "@/components/ui/Button"
import SearchableSelect from "@/components/ui/SearchableSelect"
import ValuationDetailCard from "./ValuationDetailCard"
import SavePanel from "./SavePanel"
import CalcKeypad from "./CalcKeypad"
import { ArrowLeft, DollarSign, Percent, Package, RotateCcw, ChefHat, Settings2 } from "lucide-react"
import type { Recipe, Valuation } from "@/types/domain"
import { getRecipeCost } from "@/lib/api"
import {
  calcPricing,
  solvePctFromPrecioVenta,
  solveCostoFromPrecioVenta,
  fmt,
  getStored,
  saveStored,
  type CalculatorMode,
  MODE_LABELS,
  type SaveFormState,
  EMPTY_SAVE,
  saveFormFromValuation,
} from "./lib"

const PCT_MP_KEY = "cosayb_pct_mp"
const MARGIN_KEY = "cosayb_margin"
const MAX_DIGITS = 12

type Step = "select" | "inputs" | "result"
type ActiveField = "costoMP" | "precioVenta" | "pctMP" | "margin"
const PERCENT_FIELDS: ActiveField[] = ["pctMP", "margin"]

const MODE_ICON: Record<CalculatorMode, typeof DollarSign> = {
  "precio-venta": DollarSign,
  "porcentaje-mp": Percent,
  "precio-mp": Package,
}

const MODE_SHORT: Record<CalculatorMode, string> = {
  "precio-venta": "Precio de venta",
  "porcentaje-mp": "% Materia prima",
  "precio-mp": "Precio materia prima",
}

export interface CalculatorPrefill {
  mode: CalculatorMode
  costoMP: number
  pctMP: number
  margin: number
  sourceValuation: Valuation
}

/** Campo LCD tocable: entra en foco y recibe dígitos del teclado físico del dispositivo. */
function CalcField({
  label,
  value,
  active,
  compact,
  inputRef,
  onActivate,
  onChange,
}: {
  label: string
  value: string
  active: boolean
  compact?: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onActivate: () => void
  onChange: (raw: string) => void
}) {
  return (
    <div
      className={`calc-input-screen ${active ? "calc-input-on" : "calc-input-off"} ${compact ? "calc-input-compact" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="calc-input-label">{label}</span>
      <input
        ref={inputRef}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onFocus={onActivate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

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
  const [step, setStep] = useState<Step>(prefill ? "result" : "select")
  const [mode, setMode] = useState<CalculatorMode | null>(prefill?.mode ?? null)

  const [costoMP, setCostoMP] = useState(prefill ? String(prefill.costoMP) : "")
  const [precioVenta, setPrecioVenta] = useState("")
  const [pctMP, setPctMP] = useState(prefill ? String(prefill.pctMP) : getStored(PCT_MP_KEY, "35"))
  const [margin, setMargin] = useState(prefill ? String(prefill.margin) : getStored(MARGIN_KEY, "3"))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeField, setActiveField] = useState<ActiveField>("costoMP")

  const costoRef = useRef<HTMLInputElement>(null)
  const ventaRef = useRef<HTMLInputElement>(null)
  const pctRef = useRef<HTMLInputElement>(null)
  const marginRef = useRef<HTMLInputElement>(null)

  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [recipeLoading, setRecipeLoading] = useState(false)

  const [savedCost, setSavedCost] = useState(prefill?.costoMP ?? 0)
  const [savedPctMP, setSavedPctMP] = useState(prefill?.pctMP ?? 0)
  const [savedMargin, setSavedMargin] = useState(prefill?.margin ?? 3)

  const [showSavePanel, setShowSavePanel] = useState(false)
  const [saveForm, setSaveForm] = useState<SaveFormState>(
    prefill ? { ...saveFormFromValuation(prefill.sourceValuation), name: "" } : EMPTY_SAVE
  )

  const recipeOptions = availableRecipes.map((r) => ({ value: r.id, label: r.name }))

  const handleRecipeSelect = useCallback(async (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    if (!recipeId) return
    setRecipeLoading(true)
    try {
      const res = await getRecipeCost(recipeId)
      if (res.data?.rawCostPerServing != null) {
        setCostoMP(String(Math.round(res.data.rawCostPerServing)))
        setSaveForm((p) => ({ ...p, refType: "recipe" }))
      }
    } catch {
      // el usuario puede seguir ingresando el costo manualmente
    } finally {
      setRecipeLoading(false)
    }
  }, [])

  function selectMode(m: CalculatorMode) {
    setMode(m)
    setActiveField(m === "precio-mp" ? "precioVenta" : "costoMP")
    setStep("inputs")
  }

  function backToSelect() {
    setStep("select")
    setMode(null)
  }

  const setters: Record<ActiveField, React.Dispatch<React.SetStateAction<string>>> = {
    costoMP: setCostoMP,
    precioVenta: setPrecioVenta,
    pctMP: setPctMP,
    margin: setMargin,
  }

  function appendDigit(d: string) {
    setters[activeField]((v) => {
      if (v.replace(".", "").length >= MAX_DIGITS) return v
      if (v === "0") return d
      return v + d
    })
  }
  function appendDecimal() {
    if (!PERCENT_FIELDS.includes(activeField)) return
    setters[activeField]((v) => (v.includes(".") ? v : v === "" ? "0." : v + "."))
  }
  function backspace() {
    setters[activeField]((v) => v.slice(0, -1))
  }
  function clearActive() {
    setters[activeField]("")
  }

  function handleCalculate() {
    if (!mode) return
    const m = parseFloat(margin) || 0
    if (mode === "precio-venta") {
      const cost = parseFloat(costoMP) || 0
      const p = parseFloat(pctMP) || 0
      setSavedCost(cost)
      setSavedPctMP(p)
      setSavedMargin(m)
    } else if (mode === "porcentaje-mp") {
      const cost = parseFloat(costoMP) || 0
      const venta = parseFloat(precioVenta) || 0
      const p = solvePctFromPrecioVenta(cost, venta, m)
      setSavedCost(cost)
      setSavedPctMP(p ?? 0)
      setSavedMargin(m)
    } else {
      const venta = parseFloat(precioVenta) || 0
      const p = parseFloat(pctMP) || 0
      const cost = solveCostoFromPrecioVenta(venta, p, m)
      setSavedCost(cost ?? 0)
      setSavedPctMP(p)
      setSavedMargin(m)
    }
    saveStored(PCT_MP_KEY, pctMP)
    saveStored(MARGIN_KEY, margin)
    setStep("result")
  }

  const result = useMemo(() => calcPricing(savedCost, savedPctMP, savedMargin), [savedCost, savedPctMP, savedMargin])

  function newCalculation() {
    onConsumedPrefill?.()
    setStep("select")
    setMode(null)
    setCostoMP("")
    setPrecioVenta("")
    setSelectedRecipeId("")
    setShowSavePanel(false)
    setSaveForm(EMPTY_SAVE)
  }

  function handleSaved() {
    onConsumedPrefill?.()
    setShowSavePanel(false)
    onSaved()
  }

  // ── Paso 1: selector de modo (teclas de función) ─────────────────────────
  if (step === "select") {
    return (
      <div className="flex flex-col items-center py-4 gap-4">
        <div className="calc-device">
          <div className="calc-device-top">
            <span className="calc-brand">CO$AYB · CALC</span>
            <div className="calc-leds">
              <span className="calc-led calc-led-on" />
              <span className="calc-led" />
              <span className="calc-led" />
            </div>
          </div>

          <div className="calc-screen">
            <span className="calc-screen-label">¿QUÉ QUIERES CALCULAR?</span>
            <span className="calc-screen-value" style={{ fontSize: 18 }}>
              Elige una función
            </span>
          </div>

          <div className="calc-mode-grid">
            {(Object.keys(MODE_LABELS) as CalculatorMode[]).map((m) => {
              const Icon = MODE_ICON[m]
              return (
                <button key={m} type="button" className="calc-key calc-key-mode" onClick={() => selectMode(m)}>
                  <Icon size={18} />
                  {MODE_SHORT[m]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Paso 2: inputs del modo elegido ───────────────────────────────────────
  if (step === "inputs" && mode) {
    const needsCosto = mode === "precio-venta" || mode === "porcentaje-mp"
    const needsVenta = mode === "porcentaje-mp" || mode === "precio-mp"
    const needsPct = mode === "precio-venta" || mode === "precio-mp"
    const multiField = [needsCosto, needsVenta, needsPct].filter(Boolean).length > 1

    const canCalculate =
      (!needsCosto || parseFloat(costoMP) > 0) &&
      (!needsVenta || parseFloat(precioVenta) > 0) &&
      (!needsPct || (parseFloat(pctMP) > 0 && parseFloat(pctMP) < 100))

    return (
      <div className="flex flex-col items-center py-4 gap-4">
        <button
          onClick={backToSelect}
          className="flex items-center gap-1.5 text-sm self-center transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Elegir otro cálculo
        </button>

        <div className="calc-device">
          <div className="calc-device-top">
            <span className="calc-brand">{MODE_LABELS[mode].title.toUpperCase()}</span>
            <div className="calc-leds">
              <span className="calc-led calc-led-on" />
              <span className="calc-led calc-led-on" />
              <span className="calc-led" />
            </div>
          </div>

          {needsCosto && (
            <CalcField
              label="PRECIO DE LA MATERIA PRIMA ($)"
              value={costoMP ? fmt(costoMP).replace("$", "$ ") : ""}
              active={activeField === "costoMP"}
              inputRef={costoRef}
              onActivate={() => setActiveField("costoMP")}
              onChange={(v) => setCostoMP(v.replace(/\D/g, "").slice(0, MAX_DIGITS))}
            />
          )}

          {needsVenta && (
            <CalcField
              label="PRECIO DE VENTA DEL PRODUCTO ($)"
              value={precioVenta ? fmt(precioVenta).replace("$", "$ ") : ""}
              active={activeField === "precioVenta"}
              inputRef={ventaRef}
              onActivate={() => setActiveField("precioVenta")}
              onChange={(v) => setPrecioVenta(v.replace(/\D/g, "").slice(0, MAX_DIGITS))}
            />
          )}

          {needsPct && (
            <CalcField
              label="% MATERIA PRIMA"
              value={pctMP ? `${pctMP}%` : ""}
              active={activeField === "pctMP"}
              inputRef={pctRef}
              onActivate={() => setActiveField("pctMP")}
              onChange={(v) => setPctMP(v.replace(/[^\d.]/g, ""))}
            />
          )}

          {multiField && (
            <p className="text-center" style={{ fontSize: 11, color: "#9BA0AA" }}>
              Toca el campo que quieres llenar antes de usar el teclado
            </p>
          )}

          <CalcKeypad onDigit={appendDigit} onDecimal={appendDecimal} onBackspace={backspace} onClear={clearActive} />

          {needsCosto && (
            <div className="flex flex-col gap-1.5">
              <SearchableSelect
                options={recipeOptions}
                value={selectedRecipeId}
                onChange={handleRecipeSelect}
                placeholder="— O cargar costo desde una receta —"
                emptyMessage="No se encontraron recetas"
                ariaLabel="Receta para autocompleto de costo"
              />
              {recipeLoading && (
                <p className="text-center" style={{ fontSize: 11, color: "#9BA0AA" }}>Calculando costo de la receta…</p>
              )}
            </div>
          )}

          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1.5 justify-center"
            style={{ fontSize: 11, color: "#9BA0AA" }}
          >
            <Settings2 size={11} />
            Ajustes avanzados
          </button>
          {showAdvanced && (
            <CalcField
              label="MARGEN DE SEGURIDAD"
              value={margin ? `${margin}%` : ""}
              active={activeField === "margin"}
              compact
              inputRef={marginRef}
              onActivate={() => setActiveField("margin")}
              onChange={(v) => setMargin(v.replace(/[^\d.]/g, ""))}
            />
          )}

          <button className="calc-key calc-key-equals" disabled={!canCalculate} onClick={handleCalculate}>
            = CALCULAR
          </button>
        </div>
      </div>
    )
  }

  // ── Paso 3: resultado ──────────────────────────────────────────────────────
  if (step === "result" && result) {
    const headlineValue =
      mode === "porcentaje-mp" ? `${result.pctMateriaprima.toFixed(1)}%` :
      mode === "precio-mp" ? fmt(savedCost) :
      fmt(result.suggested)

    return (
      <div className="flex flex-col items-center py-4 gap-4">
        <button
          onClick={newCalculation}
          className="flex items-center gap-1.5 text-sm self-center transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Nuevo cálculo
        </button>

        <div className="calc-device">
          <div className="calc-device-top">
            <span className="calc-brand">{mode ? MODE_LABELS[mode].result.toUpperCase() : ""}</span>
            <div className="calc-leds">
              <span className="calc-led calc-led-on" />
              <span className="calc-led calc-led-on" />
              <span className="calc-led calc-led-on" />
            </div>
          </div>
          <div className="calc-screen">
            <span className="calc-screen-value calc-screen-value-lg">{headlineValue}</span>
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col gap-5">
          <ValuationDetailCard result={result} cost={savedCost} margin={savedMargin} />

          {!showSavePanel ? (
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" onClick={newCalculation}>
                <RotateCcw size={14} />
                Nuevo cálculo
              </Button>
              <Button variant="primary" onClick={() => setShowSavePanel(true)}>
                <ChefHat size={14} />
                Guardar en historial
              </Button>
            </div>
          ) : (
            <SavePanel
              form={saveForm}
              onChange={setSaveForm}
              costMateriaprima={savedCost}
              pctMateriaprima={savedPctMP}
              safetyMargin={savedMargin}
              recipeId={selectedRecipeId || null}
              onCancel={() => setShowSavePanel(false)}
              onSaved={handleSaved}
            />
          )}
        </div>
      </div>
    )
  }

  return null
}

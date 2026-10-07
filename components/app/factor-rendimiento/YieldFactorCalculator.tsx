"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { CalendarDays, Undo2 } from "lucide-react"
import { saveFactorRendimientoAsIngrediente } from "@/lib/api"
import Button from "@/components/ui/Button"
import { CalcBreakdown, CalcPanel, useSolverCalculator, type CalcPanelField } from "@/components/calculator"
import CalcViewShell from "@/components/calculator/CalcViewShell"
import { formatMoneyEntry, parseEntry, type EntryOptions } from "@/lib/calculator/entry"
import { formatCOP, formatCOPDecimals, formatPercent } from "@/lib/calculator/format"
import {
  WASTE_FIELDS,
  YIELD_FIELD_META,
  YIELD_WASTE_SLOTS,
  describeYieldMissing,
  missingYieldInputs,
  placeWastes,
  solveYieldFactor,
  type YieldField,
  type YieldInputs,
  type YieldOutcome,
  type YieldVariant,
} from "@/lib/calculator/yieldFactor"
import type { FactorRendimiento } from "@/types/domain"

export interface YieldSubmitData {
  variant: YieldVariant
  ingredientName: string
  totalCost: string
  totalWeightGrams: string
  wasteItems: { name: string; weightGrams: string }[]
}

/** Lo que la lista necesita para mostrar el registro recién guardado */
export interface YieldSavedInfo {
  id: string
  name: string
  message: string
}

const GRAMS: EntryOptions = { decimals: true, maxDigits: 9, maxDecimals: 2 }

const ENTRY: Record<YieldField, EntryOptions> = {
  totalCost: { decimals: true, maxDigits: 12, maxDecimals: 2 },
  totalWeight: GRAMS,
  waste1: GRAMS,
  waste2: GRAMS,
  waste3: GRAMS,
  waste4: GRAMS,
}

/** "1.230 g", conservando la coma mientras se escribe el decimal */
function formatGramsEntry(raw: string) {
  if (raw === "" || parseEntry(raw) == null) return ""
  const [int = "0", dec] = raw.split(".")
  const intText = Number(int).toLocaleString("es-CO", { maximumFractionDigits: 0 })
  return `${intText}${raw.includes(".") ? `,${dec ?? ""}` : ""} g`
}

const solve = (v: Record<YieldField, number | null>) => solveYieldFactor(v as YieldInputs)

const toRaw = (n: number | null | undefined, decimals: boolean) =>
  n == null || !Number.isFinite(n) || n <= 0 ? "" : decimals ? String(Number(n.toFixed(2))) : String(Math.round(n))

const VARIANTS: { key: YieldVariant; label: string }[] = [
  { key: "bfactor", label: "Carnes, pescados, mariscos" },
  { key: "bfactorveg", label: "Verduras, frutas, hortalizas" },
]

const LAST_VARIANT_KEY = "cosayb.yieldFactor.lastVariant"

function readLastVariant(): YieldVariant {
  try {
    const v = window.localStorage.getItem(LAST_VARIANT_KEY)
    if (v === "bfactor" || v === "bfactorveg") return v
  } catch {
    /* sin almacenamiento: se usa el valor por defecto */
  }
  return "bfactor"
}

function rememberVariant(v: YieldVariant) {
  try {
    window.localStorage.setItem(LAST_VARIANT_KEY, v)
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/**
 * Vista completa de Factor de rendimiento (hojas FDRPROTEINAS y
 * FDRVEGETALES): el tipo de ingrediente, su nombre y la calculadora con costo,
 * peso y las cuatro bajas. Calcular muestra el nuevo costo por gramo; solo
 * entonces se puede guardar. Crea y edita (el historial viejo se acomoda en
 * los cuatro espacios sin perder gramos).
 */
export default function YieldFactorCalculator({
  editingFactor,
  onSubmit,
  onDone,
  onCancel,
}: {
  editingFactor?: FactorRendimiento | null
  /** `existingId`: el factor ya se guardó en este intento, hay que actualizarlo (no duplicarlo) */
  onSubmit: (data: YieldSubmitData, existingId?: string) => Promise<{ id: string } | void>
  onDone: (info: YieldSavedInfo) => void
  onCancel: () => void
}) {
  const [boot] = useState(() => {
    // Al crear se recuerda el último tipo usado; al editar manda el del registro.
    const variant: YieldVariant = editingFactor?.variant ?? readLastVariant()
    const placed = placeWastes(
      variant,
      (editingFactor?.wasteItems ?? []).map((w) => ({ name: w.name, weightGrams: parseFloat(w.weightGrams) || 0 })),
    )
    return {
      variant,
      names: placed.names,
      values: {
        totalCost: toRaw(editingFactor ? parseFloat(editingFactor.totalCost) : null, true),
        totalWeight: toRaw(editingFactor ? parseFloat(editingFactor.totalWeightGrams) : null, true),
        waste1: toRaw(placed.grams[0], true),
        waste2: toRaw(placed.grams[1], true),
        waste3: toRaw(placed.grams[2], true),
        waste4: toRaw(placed.grams[3], true),
      } satisfies Record<YieldField, string>,
    }
  })

  const [variant, setVariant] = useState<YieldVariant>(boot.variant)
  /** Nombre que se guarda por espacio (los registros viejos conservan el suyo) */
  const [wasteNames, setWasteNames] = useState<string[]>(boot.names)
  const [ingredientName, setIngredientName] = useState(editingFactor?.ingredientName ?? "")
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  /** Id del factor ya guardado en este intento (si el ingrediente falló, reintentar no duplica) */
  const [savedId, setSavedId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  /** Bajas borradas por cambiar de tipo, para poder deshacer */
  const [cleared, setCleared] = useState<{ variant: YieldVariant; names: string[]; values: Partial<Record<YieldField, string>> } | null>(null)

  const calc = useSolverCalculator<YieldField, YieldOutcome>({
    entry: ENTRY,
    initial: boot.values,
    first: editingFactor ? "totalWeight" : "totalCost",
    solve,
  })

  const fields = useMemo<CalcPanelField<YieldField>[]>(
    () => [
      { key: "totalCost", label: YIELD_FIELD_META.totalCost.lcd, ariaLabel: YIELD_FIELD_META.totalCost.label, format: formatMoneyEntry, placeholder: "$ 0" },
      { key: "totalWeight", label: YIELD_FIELD_META.totalWeight.lcd, ariaLabel: YIELD_FIELD_META.totalWeight.label, format: formatGramsEntry, placeholder: "0 g" },
      ...WASTE_FIELDS.map<CalcPanelField<YieldField>>((key, i) => ({
        key,
        label: `${wasteNames[i].toUpperCase()} (G)`,
        ariaLabel: `${wasteNames[i]} (gramos que se pierden)`,
        format: formatGramsEntry,
        placeholder: "0 g",
        variant: "inline",
      })),
    ],
    [wasteNames],
  )

  /** Hay algo escrito que se perdería al salir (y todavía no se guardó) */
  const dirty =
    !savedId &&
    (ingredientName.trim() !== (editingFactor?.ingredientName ?? "").trim() ||
      (Object.keys(boot.values) as YieldField[]).some((f) => calc.values[f] !== boot.values[f]) ||
      (!!editingFactor && variant !== boot.variant))

  // Cerrar la pestaña o recargar con datos sin guardar: el navegador avisa.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const wastesEmpty = WASTE_FIELDS.every((f) => !calc.values[f])

  function changeVariant(next: YieldVariant) {
    if (next === variant) return
    // Las bajas de un tipo no significan lo mismo en el otro: se limpian,
    // pero se guardan por si fue un toque sin querer.
    if (!wastesEmpty) {
      setCleared({
        variant,
        names: wasteNames,
        values: Object.fromEntries(WASTE_FIELDS.map((f) => [f, calc.values[f]])),
      })
    } else {
      setCleared(null)
    }
    setVariant(next)
    setWasteNames(YIELD_WASTE_SLOTS[next].map((s) => s.name))
    calc.fill({ waste1: "", waste2: "", waste3: "", waste4: "" })
    if (!editingFactor) rememberVariant(next)
  }

  function undoVariant() {
    if (!cleared) return
    setVariant(cleared.variant)
    setWasteNames(cleared.names)
    calc.fill(cleared.values)
    setCleared(null)
    if (!editingFactor) rememberVariant(cleared.variant)
  }

  const result = calc.outcome?.ok ? calc.outcome : null
  const error = calc.outcome && !calc.outcome.ok ? calc.outcome : null
  const missing = missingYieldInputs(calc.inputs)

  let tone: "idle" | "error" | "result" = "idle"
  let value = formatCOPDecimals(0)
  let sub: string = missing.length > 0 ? describeYieldMissing(missing) : "Pulsa Calcular"
  let announce = ""
  if (result) {
    tone = "result"
    value = formatCOPDecimals(result.newCostPerGram)
    sub = `por gramo · rendimiento ${formatPercent(result.yieldFactor * 100, 2)}`
    announce = `Nuevo costo del gramo: ${value}`
  } else if (error) {
    tone = "error"
    sub = error.message
    announce = error.message
  }

  async function handleSave(alsoIngredient: boolean) {
    if (!result || savingRef.current) return
    const name = ingredientName.trim()
    if (!name) {
      setNameError("Escribe el nombre del ingrediente para poder guardarlo.")
      nameRef.current?.focus()
      return
    }
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      let id = savedId ?? editingFactor?.id ?? null
      const res = await onSubmit(
        {
          variant,
          ingredientName: name,
          totalCost: String(calc.inputs.totalCost),
          totalWeightGrams: String(calc.inputs.totalWeight),
          wasteItems: WASTE_FIELDS.flatMap((f, i) =>
            (calc.inputs[f] ?? 0) > 0 ? [{ name: wasteNames[i], weightGrams: String(calc.inputs[f]) }] : [],
          ),
        },
        savedId ?? undefined,
      )
      id = res?.id ?? id
      if (id) setSavedId(id)

      let message = editingFactor || savedId ? "Cambios guardados." : "Factor guardado."
      if (alsoIngredient) {
        if (!id) {
          setSaveError("El factor se guardó, pero no se pudo crear el ingrediente limpio. Inténtalo otra vez desde la lista.")
          return
        }
        try {
          await saveFactorRendimientoAsIngrediente(id)
          message = "Factor guardado y ingrediente limpio creado en Inventario."
        } catch (e) {
          setSaveError(
            `El factor sí se guardó, pero no se pudo crear el ingrediente en Inventario${e instanceof Error && e.message ? ` (${e.message})` : ""}. Puedes intentarlo de nuevo o volver a la lista.`,
          )
          return
        }
      }
      onDone({ id: id ?? "", name, message })
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const [entryDate] = useState(() => new Date(editingFactor?.createdAt ?? Date.now()).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }))

  return (
    <CalcViewShell
      title={editingFactor ? `Editar: ${editingFactor.ingredientName}` : "Nuevo factor de rendimiento"}
      subtitle="Escribe lo que pagaste, el peso y lo que se pierde. Te decimos cuánto cuesta de verdad cada gramo que aprovechas."
      backLabel="Mis factores"
      onBack={onCancel}
      dirty={dirty}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:items-start">
        {/* Tipo y nombre primero: en el celular se ven antes que la calculadora */}
        <div className="flex flex-col gap-3 min-w-0 md:col-start-2 md:row-start-1">
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <CalendarDays size={13} aria-hidden="true" />
            Fecha de entrada: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{entryDate}</span>
          </p>

          <Step n={1} title="¿Qué tipo de ingrediente es?">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Tipo de ingrediente">
              {VARIANTS.map((v) => {
                const on = variant === v.key
                return (
                  <button
                    key={v.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => changeVariant(v.key)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
                    style={{
                      background: on ? "var(--accent)" : "var(--bg-surface)",
                      color: on ? "white" : "var(--text-secondary)",
                      border: `1px solid ${on ? "var(--accent)" : "var(--border-light)"}`,
                    }}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
            {cleared && wastesEmpty && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" role="status" style={{ color: "var(--text-muted)" }}>
                Al cambiar el tipo se borraron los gramos que se pierden.
                <button
                  type="button"
                  onClick={undoVariant}
                  className="inline-flex items-center gap-1 font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  style={{ color: "var(--accent-text)" }}
                >
                  <Undo2 size={12} aria-hidden="true" />
                  Deshacer
                </button>
              </p>
            )}
          </Step>

          <Step n={2} title="Nombre del ingrediente" htmlFor="yield-name">
            <input
              ref={nameRef}
              id="yield-name"
              type="text"
              value={ingredientName}
              maxLength={120}
              autoComplete="off"
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "yield-name-error" : undefined}
              onChange={(e) => {
                setIngredientName(e.target.value)
                setNameError(null)
                setSaveError(null)
              }}
              placeholder="Pollo, papa, lomo de res…"
              className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)]"
              style={{
                background: "var(--bg-surface)",
                border: `1px solid ${nameError ? "#DC2626" : "var(--border-light)"}`,
                color: "var(--text-primary)",
              }}
            />
            {nameError && (
              <p id="yield-name-error" className="text-xs" role="alert" style={{ color: "#DC2626" }}>
                {nameError}
              </p>
            )}
          </Step>
        </div>

        <div className="min-w-0 md:col-start-1 md:row-start-1 md:row-span-2">
          <CalcPanel
            label="Calculadora de factor de rendimiento"
            display={{ label: "NUEVO COSTO DEL GRAMO", value, sub, tone, announce, revealKey: result ? result.newCostPerGram : undefined }}
            fields={fields}
            values={calc.values}
            entry={calc.entry}
            active={calc.active}
            fresh={calc.fresh && !result}
            errorField={error?.field}
            onActivate={calc.activate}
            onKey={calc.press}
            onRawInput={calc.setRaw}
            onCalculate={calc.calculate}
            onClearAll={calc.clearAll}
          />
        </div>

        <div className="flex flex-col gap-3 min-w-0 md:col-start-2 md:row-start-2">
          <Step n={3} title="Calcula">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              En la calculadora escribe lo que pagaste, el peso y lo que se pierde ({wasteNames.join(", ").toLowerCase()}). Luego pulsa{" "}
              <strong>Calcular</strong>.
            </p>
          </Step>

          {result ? (
            <Step n={4} title="Revisa y guarda">
              <div className="flex flex-col gap-3">
                <CalcBreakdown
                  rows={[
                    { label: "Costo del gramo (sin bajas)", value: formatCOPDecimals(result.costPerGram) },
                    ...WASTE_FIELDS.flatMap((f, i) =>
                      (calc.inputs[f] ?? 0) > 0
                        ? [{ label: `Costo de ${wasteNames[i].toLowerCase()}`, value: formatCOP(result.wasteCosts[f]) }]
                        : [],
                    ),
                    {
                      label: `Total baja (${result.wasteWeight.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g)`,
                      value: formatCOP(result.wasteCost),
                    },
                    { label: "Nuevo peso útil", value: `${result.netWeight.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g` },
                    { label: "Nuevo costo del gramo", value: formatCOPDecimals(result.newCostPerGram), strong: true },
                    { label: "Rendimiento total", value: formatPercent(result.yieldFactor * 100, 2), strong: true },
                  ]}
                />

                {saveError && (
                  <p className="text-sm" role="alert" style={{ color: "#DC2626" }}>
                    {saveError}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="primary" onClick={() => handleSave(false)} loading={saving} className="sm:flex-1">
                    {editingFactor || savedId ? "Guardar cambios" : "Guardar factor"}
                  </Button>
                  <Button variant="ghost" onClick={() => handleSave(true)} disabled={saving} className="sm:flex-1">
                    {editingFactor ? "Guardar y actualizar ingrediente" : "Guardar como ingrediente"}
                  </Button>
                </div>
                {savedId && (
                  <button
                    type="button"
                    onClick={() => onDone({ id: savedId, name: ingredientName.trim(), message: "Factor guardado." })}
                    className="self-start text-sm font-medium underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={{ color: "var(--accent-text)" }}
                  >
                    Volver a mis factores
                  </button>
                )}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  «Guardar como ingrediente» crea además en Inventario el ingrediente «{ingredientName.trim() || "nombre"} (LIMPIO)», con el peso útil y el nuevo
                  costo por gramo, listo para usar en recetas.
                </p>
              </div>
            </Step>
          ) : (
            <p className="text-xs px-1" style={{ color: "var(--text-muted)" }}>
              Cuando calcules, aquí verás el desglose y podrás guardar el ingrediente.
            </p>
          )}
        </div>
      </div>
    </CalcViewShell>
  )
}

/** Paso numerado: tarjeta con el número en un círculo y su título. */
function Step({ n, title, htmlFor, children }: { n: number; title: string; htmlFor?: string; children: ReactNode }) {
  const heading = (
    <>
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {n}
      </span>
      {title}
    </>
  )
  const cls = "flex items-center gap-2 text-sm font-semibold"
  return (
    <section
      className="rounded-2xl p-3.5 flex flex-col gap-2.5"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
    >
      {htmlFor ? (
        <label htmlFor={htmlFor} className={cls} style={{ color: "var(--text-primary)" }}>
          {heading}
        </label>
      ) : (
        <p className={cls} style={{ color: "var(--text-primary)" }}>
          {heading}
        </p>
      )}
      {children}
    </section>
  )
}

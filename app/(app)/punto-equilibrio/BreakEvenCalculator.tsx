"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, ListChecks, Package } from "lucide-react"
import Button from "@/components/ui/Button"
import {
  CalcBreakdown,
  CalcDevice,
  CalcDisplay,
  CalcKeypad,
  CalcRegister,
  useSolverCalculator,
} from "@/components/calculator"
import {
  entryKeyFromKeyboard,
  formatMoneyEntry,
  parseEntry,
  type EntryKey,
  type EntryOptions,
} from "@/lib/calculator/entry"
import { formatCOP, formatNumber } from "@/lib/calculator/format"
import {
  BREAK_EVEN_RUBROS,
  BREAK_EVEN_RUBRO_KEYS,
  distributeFixedCosts,
  rubrosToFixedCosts,
  solveBreakEven,
  sumRubros,
  type BreakEvenOutcome,
  type BreakEvenRubro,
} from "@/lib/calculator/breakEven"
import type { BreakEvenRecord } from "@/types/domain"
import styles from "./breakEven.module.css"

type Field = BreakEvenRubro | "salePrice" | "variableCost"
type Step = "fixed" | "product"
type Outcome = Extract<BreakEvenOutcome, { ok: true }> | { ok: false; field: Field; message: string }

export interface BreakEvenSubmitData {
  fixedCosts: { name: string; amount: number }[]
  salePrice: number
  variableCost: number
}

// 9 dígitos = hasta "$ 999.999.999": es lo que cabe sin cortarse en el registro en línea.
const MONEY: EntryOptions = { decimals: false, maxDigits: 9 }
const FIELD_ORDER: Field[] = [...BREAK_EVEN_RUBRO_KEYS, "salePrice", "variableCost"]
const ENTRY = Object.fromEntries(FIELD_ORDER.map((k) => [k, MONEY])) as Record<Field, EntryOptions>
const stepOf = (f: Field): Step => (f === "salePrice" || f === "variableCost" ? "product" : "fixed")

const LABELS: Record<Field, { lcd: string; aria: string }> = {
  ...(Object.fromEntries(
    BREAK_EVEN_RUBROS.map((r) => [r.key, { lcd: r.lcd, aria: `${r.name} (pesos al mes)` }]),
  ) as Record<BreakEvenRubro, { lcd: string; aria: string }>),
  salePrice: { lcd: "PRECIO DE VENTA", aria: "Precio de venta de un producto" },
  variableCost: { lcd: "COSTO VARIABLE", aria: "Costo variable de un producto" },
}

const toRaw = (n: number | null | undefined) => (n != null && Number.isFinite(n) && n > 0 ? String(Math.round(n)) : "")

/** Huella de los datos escritos: dice si hay algo sin guardar y si ya se guardó. */
const signature = (v: Record<Field, number | null>) => FIELD_ORDER.map((k) => v[k] ?? "").join("|")

function solve(v: Record<Field, number | null>): Outcome {
  const fixed = sumRubros(v)
  if (fixed <= 0) {
    return {
      ok: false,
      field: "rent",
      message: "Anota al menos un costo fijo (arriendo, sueldos, servicios…)",
    }
  }
  const r = solveBreakEven({ fixedCosts: fixed, salePrice: v.salePrice, variableCost: v.variableCost })
  if (r.ok) return r
  const field: Field = r.field === "fixedCosts" ? "rent" : r.field
  if (r.reason === "invalid") {
    return {
      ok: false,
      field,
      message: `El precio (${formatCOP(v.salePrice ?? 0)}) debe ser mayor al costo variable (${formatCOP(v.variableCost ?? 0)}); si no, no ganas nada por unidad`,
    }
  }
  const noVariable = r.message.includes("costo variable")
  return { ok: false, field, message: noVariable ? `${r.message} (escribe 0 si tu producto no tiene insumos)` : r.message }
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

/**
 * Pantalla de "Nuevo cálculo": la calculadora ES el proceso. Dos pasos —
 * costos fijos (los 9 rubros de la hoja PUNTOEKILIBRIO, el total se suma
 * solo) y el producto (precio y costo variable). Calcular muestra unidades
 * y ventas por mes y por día; solo entonces se puede guardar.
 */
export default function BreakEvenCalculator({
  initialRecord,
  fixedOnly = false,
  prefillNote = null,
  onSubmit,
  onDone,
  onDirtyChange,
}: {
  initialRecord: BreakEvenRecord | null
  /** Parte solo de los costos fijos del registro (el producto empieza en blanco) */
  fixedOnly?: boolean
  /** Aviso de dónde salen los datos precargados */
  prefillNote?: string | null
  onSubmit: (data: BreakEvenSubmitData) => Promise<void>
  onDone: () => void
  /** Hay datos escritos sin guardar */
  onDirtyChange?: (dirty: boolean) => void
}) {
  const [boot] = useState(() => {
    const rubros = distributeFixedCosts(initialRecord?.fixedCosts ?? [])
    const values = Object.fromEntries(FIELD_ORDER.map((k) => [k, ""])) as Record<Field, string>
    for (const k of BREAK_EVEN_RUBRO_KEYS) values[k] = toRaw(rubros[k])
    if (!fixedOnly) {
      values.salePrice = toRaw(initialRecord?.salePrice)
      values.variableCost = toRaw(initialRecord?.variableCost)
    }
    return values
  })

  const calc = useSolverCalculator<Field, Outcome>({ entry: ENTRY, initial: boot, first: "rent", solve })
  const [step, setStep] = useState<Step>("fixed")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [note, setNote] = useState(prefillNote)
  const [clearArmed, setClearArmed] = useState(false)
  // Con qué datos se abrió o qué se guardó por última vez: contra eso se mide "sin guardar".
  const [baseline, setBaseline] = useState(() =>
    signature(Object.fromEntries(FIELD_ORDER.map((k) => [k, parseEntry(boot[k])])) as Record<Field, number | null>),
  )
  const [savedSig, setSavedSig] = useState<string | null>(null)
  const savingRef = useRef(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const registerRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({})

  const result = calc.outcome?.ok ? calc.outcome : null
  const error = calc.outcome && !calc.outcome.ok ? calc.outcome : null
  const fixedTotal = sumRubros(calc.inputs)
  const filledRubros = BREAK_EVEN_RUBRO_KEYS.filter((k) => (calc.inputs[k] ?? 0) > 0).length
  const hasData = FIELD_ORDER.some((k) => calc.inputs[k] != null)

  const sig = signature(calc.inputs)
  const dirty = sig !== baseline
  // "Guardado" vale solo para estos datos exactos: editar algo es otro cálculo, pero
  // volver a pulsar Calcular con lo mismo no deja guardar un duplicado.
  const saved = result !== null && savedSig === sig

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  // Recargar o cerrar la pestaña con datos sin guardar: el navegador avisa.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // "Limpiar" borra los 11 datos de golpe: hay que tocarlo dos veces.
  useEffect(() => {
    if (!clearArmed) return
    const t = window.setTimeout(() => setClearArmed(false), 4000)
    return () => window.clearTimeout(t)
  }, [clearArmed])

  // En una columna (móvil) el resultado queda bajo el teclado: llévalo a la vista.
  const resultReady = result !== null
  useEffect(() => {
    if (!resultReady) return
    if (!window.matchMedia("(max-width: 767px)").matches) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }, [resultReady])

  function press(key: EntryKey) {
    setClearArmed(false)
    calc.press(key)
  }

  function handleClearAll() {
    if (hasData && !clearArmed) {
      setClearArmed(true)
      return
    }
    setClearArmed(false)
    setNote(null)
    calc.clearAll()
    setStep("fixed")
  }

  /** "Empezar en blanco" del aviso: descarta lo precargado sin pedir doble toque. */
  function startBlank() {
    setClearArmed(false)
    setNote(null)
    calc.clearAll()
    setStep("fixed")
    setBaseline(signature(Object.fromEntries(FIELD_ORDER.map((k) => [k, null])) as Record<Field, number | null>))
  }

  /** Lleva el foco (y la vista) al dato: el teclado físico y el lector de pantalla siguen al dato activo. */
  function focusField(field: Field) {
    requestAnimationFrame(() => {
      const el = registerRefs.current[field]
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: "nearest" })
    })
  }

  /** Calcula; un error en un dato del otro paso nos lleva a ese paso. */
  function calculate() {
    setClearArmed(false)
    const r = calc.calculate()
    if (!r.ok) {
      setStep(stepOf(r.field))
      focusField(r.field)
    }
  }

  function goTo(field: Field) {
    setStep(stepOf(field))
    calc.activate(field)
  }

  function goStep(next: Step) {
    const field: Field = next === "fixed" ? "rent" : "salePrice"
    setStep(next)
    calc.activate(field)
    focusField(field)
  }

  /** Enter: pasa al siguiente dato; en el último, calcula. */
  function advance() {
    const i = FIELD_ORDER.indexOf(calc.active)
    if (i >= FIELD_ORDER.length - 1) {
      calculate()
      return
    }
    const next = FIELD_ORDER[i + 1]
    goTo(next)
    focusField(next)
  }

  // Teclado físico: escribe en el dato activo sin hacer clic antes.
  const live = useRef({ active: calc.active, press, advance })
  useEffect(() => {
    live.current = { active: calc.active, press, advance }
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="listbox"]')) return
      const dialog = document.querySelector('[aria-modal="true"]')
      if (dialog && !dialog.contains(wrapRef.current)) return
      const c = live.current
      const t = e.target as HTMLElement | null
      if (e.key === "Enter" && !t?.closest?.("a,button,summary,[role]")) {
        e.preventDefault()
        c.advance()
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

  function renderRegister(key: Field, variant: "block" | "inline") {
    const hasError = error?.field === key
    return (
      <CalcRegister
        key={key}
        ref={(el) => {
          registerRefs.current[key] = el
        }}
        id={`be-${key}`}
        label={LABELS[key].lcd}
        ariaLabel={LABELS[key].aria}
        display={formatMoneyEntry(calc.values[key])}
        placeholder="$ 0"
        active={calc.active === key}
        fresh={calc.fresh && !result}
        error={hasError}
        describedBy={hasError ? "be-message" : undefined}
        variant={variant}
        onActivate={() => goTo(key)}
        onKey={press}
        onRawInput={(raw) => {
          setClearArmed(false)
          calc.setRaw(key, raw)
        }}
        onEnter={advance}
      />
    )
  }

  // Pantalla: total de costos fijos mientras se llena; unidades al calcular.
  const missingProduct = [
    (calc.inputs.salePrice ?? 0) <= 0 && "el precio de venta",
    calc.inputs.variableCost == null && "el costo variable",
  ].filter(Boolean) as string[]

  let tone: "idle" | "error" | "result" = "idle"
  let label = "COSTOS FIJOS DEL MES"
  let value = formatCOP(fixedTotal)
  let sub: string =
    fixedTotal <= 0
      ? step === "fixed"
        ? "Toca un rubro y escribe cuánto pagas al mes"
        : "Falta anotar tus costos fijos (paso 1)"
      : step === "fixed"
        ? `${filledRubros} de 9 rubros · se suma solo`
        : missingProduct.length > 0
          ? `Falta ${missingProduct.join(" y ")}`
          : "Pulsa Calcular"
  let announce = ""
  if (result) {
    tone = "result"
    label = "UNIDADES AL MES"
    value = formatNumber(result.unitsPerMonth)
    sub = "para cubrir tus costos"
    announce = `Punto de equilibrio: ${value} unidades al mes`
  } else if (error) {
    tone = "error"
    sub = error.message
    announce = error.message
  }
  if (clearArmed) sub = "Toca Limpiar otra vez para borrar todos los datos"

  async function handleSave() {
    if (!result || savingRef.current || saved) return
    savingRef.current = true
    const savingSig = sig
    setSaving(true)
    setSaveError(null)
    try {
      await onSubmit({
        fixedCosts: rubrosToFixedCosts(calc.inputs),
        salePrice: result.salePrice,
        variableCost: result.variableCost,
      })
      setSavedSig(savingSig)
      setBaseline(savingSig)
    } catch (e) {
      setSaveError(
        e instanceof Error && e.message
          ? `${e.message}. Tus datos siguen aquí: intenta guardar de nuevo.`
          : "No se pudo guardar el cálculo. Tus datos siguen aquí: intenta guardar de nuevo.",
      )
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const costRows = result
    ? BREAK_EVEN_RUBROS.filter((r) => (calc.inputs[r.key] ?? 0) > 0).map((r) => ({
        label: r.name,
        value: formatCOP(calc.inputs[r.key] ?? 0),
      }))
    : []

  const stepBtn = (s: Step, n: number, title: string, detail: string) => {
    const on = step === s
    return (
      <button
        type="button"
        onClick={() => goStep(s)}
        aria-current={on ? "step" : undefined}
        className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors"
        style={{
          background: on ? "var(--accent-light)" : "var(--bg-surface)",
          border: `1px solid ${on ? "var(--accent)" : "var(--border-light)"}`,
          color: "var(--text-primary)",
        }}
      >
        <span
          className="shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
          style={{
            width: 24,
            height: 24,
            background: on ? "var(--accent)" : "var(--bg-secondary)",
            color: on ? "#fff" : "var(--text-muted)",
          }}
        >
          {n}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold truncate">{title}</span>
          <span className="block text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {detail}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
      <div ref={wrapRef} className="flex flex-col gap-3 min-w-0">
        {note && (
          <div
            className="flex flex-col gap-2 rounded-xl p-3 text-sm sm:flex-row sm:items-center"
            style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          >
            <p className="flex-1">{note}</p>
            <Button variant="ghost" size="sm" onClick={startBlank} className="shrink-0">
              Empezar en blanco
            </Button>
          </div>
        )}

        <div className="flex gap-2" role="group" aria-label="Pasos del cálculo">
          {stepBtn("fixed", 1, "Costos fijos", fixedTotal > 0 ? formatCOP(fixedTotal) : "Lo que pagas al mes")}
          {stepBtn(
            "product",
            2,
            "Tu producto",
            (calc.inputs.salePrice ?? 0) > 0 ? `Vende a ${formatCOP(calc.inputs.salePrice ?? 0)}` : "Precio y costo",
          )}
        </div>

        <CalcDevice label="Calculadora de punto de equilibrio">
          <CalcDisplay
            label={label}
            value={value}
            sub={sub}
            subId="be-message"
            tone={tone}
            announce={announce}
            revealKey={result ? result.unitsPerMonth : undefined}
          />

          {step === "fixed" ? (
            <div className={styles.rubros}>{BREAK_EVEN_RUBRO_KEYS.map((k) => renderRegister(k, "inline"))}</div>
          ) : (
            <div className={styles.product}>
              <div className="calc-registers">
                {renderRegister("salePrice", "block")}
                {renderRegister("variableCost", "block")}
              </div>
            </div>
          )}

          <div className="calc-keypad-slot">
            <CalcKeypad onKey={press} onClearAll={handleClearAll} decimalEnabled={false} />
          </div>

          <button type="button" className="calc-key calc-key-equals" onClick={calculate}>
            Calcular
          </button>
        </CalcDevice>

        {step === "fixed" && (
          <Button variant="ghost" onClick={() => goStep("product")} className="w-full">
            Siguiente: tu producto
            <ArrowRight size={15} />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        {!result ? (
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2">
              <ListChecks size={18} style={{ color: "var(--accent)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Cómo se calcula
              </h2>
            </div>
            <ol className="flex flex-col gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li className="flex gap-3">
                <span className="font-bold" style={{ color: "var(--accent)" }}>1.</span>
                <span>
                  <strong style={{ color: "var(--text-primary)" }}>Costos fijos.</strong> Toca cada rubro y escribe lo
                  que pagas al mes: arriendo, sueldos y servicios. Los que no tengas déjalos en blanco; el total se
                  suma solo. {filledRubros > 0 && <em>Llevas {filledRubros} de 9.</em>}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold" style={{ color: "var(--accent)" }}>2.</span>
                <span>
                  <strong style={{ color: "var(--text-primary)" }}>Tu producto.</strong> El precio al que vendes una
                  unidad y lo que te cuestan sus insumos (costo variable).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold" style={{ color: "var(--accent)" }}>3.</span>
                <span>
                  Pulsa <strong style={{ color: "var(--text-primary)" }}>Calcular</strong> (o Enter en el último dato).
                  Verás cuánto vender por mes y por día, y podrás guardarlo.
                </span>
              </li>
            </ol>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Con el teclado del computador también puedes escribir; Enter pasa al siguiente dato. Al tocar un dato que
              ya tiene valor, lo primero que escribas lo reemplaza.
            </p>
          </div>
        ) : (
          <>
            <div
              ref={resultRef}
              className="rounded-2xl p-5 flex flex-col gap-1 scroll-mt-4"
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}
            >
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--accent-text)" }}>
                TU PUNTO DE EQUILIBRIO
              </p>
              <p className="text-base" style={{ color: "var(--text-primary)" }}>
                Necesitas vender{" "}
                <strong>{formatNumber(result.unitsPerMonth)} unidades al mes</strong> ({formatNumber(result.unitsPerDay)} al
                día), es decir <strong>{formatCOP(result.revenuePerMonth)}</strong> al mes ({formatCOP(result.revenuePerDay)} al día)
                para cubrir todos tus costos. Desde ahí empiezas a ganar.
              </p>
            </div>

            <CalcBreakdown
              rows={[
                { label: "Costos fijos del mes", value: formatCOP(result.fixedCosts) },
                { label: "Margen de contribución por unidad", value: formatCOP(result.contributionMargin) },
                { label: "Unidades al mes", value: formatNumber(result.unitsPerMonth), strong: true },
                { label: "Unidades al día", value: formatNumber(result.unitsPerDay) },
                { label: "Venta al mes", value: formatCOP(result.revenuePerMonth), strong: true },
                { label: "Venta al día", value: formatCOP(result.revenuePerDay) },
              ]}
            />

            <CalcBreakdown title="Costos fijos" rows={costRows} />

            {saveError && (
              <p className="text-sm" role="alert" style={{ color: "#DC2626" }}>
                {saveError}
              </p>
            )}
            {saved ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm flex items-center gap-1.5" role="status" style={{ color: "#166534" }}>
                  <CheckCircle2 size={14} /> Guardado: ya aparece primero en tu historial
                </p>
                <Button variant="ghost" onClick={onDone}>
                  <Package size={15} />
                  Volver al historial
                </Button>
              </div>
            ) : (
              <Button variant="primary" onClick={handleSave} loading={saving}>
                Guardar en mi historial
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

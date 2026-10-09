"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, CheckCircle2, ListChecks, Wallet, X } from "lucide-react"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import {
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
import { solveBreakEven, type BreakEvenOutcome } from "@/lib/calculator/breakEven"
import type { BreakEvenRecord } from "@/types/domain"
import BreakEvenFicha from "./BreakEvenFicha"
import styles from "./breakEven.module.css"

type Field = "amount" | "salePrice" | "variableCost"
type Step = "fixed" | "product"
type Outcome = Extract<BreakEvenOutcome, { ok: true }> | { ok: false; field: Field; message: string }
/** Costo fijo de la lista libre del paso 1: lo que el usuario nombra y agrega. */
type FixedItem = { name: string; amount: number }

export interface BreakEvenSubmitData {
  fixedCosts: { name: string; amount: number }[]
  salePrice: number
  variableCost: number
}

// 9 dígitos = hasta "$ 999.999.999": es lo que cabe sin cortarse en la pantalla del registro.
const MONEY: EntryOptions = { decimals: false, maxDigits: 9 }
const FIELD_ORDER: Field[] = ["amount", "salePrice", "variableCost"]
const ENTRY = Object.fromEntries(FIELD_ORDER.map((k) => [k, MONEY])) as Record<Field, EntryOptions>
const stepOf = (f: Field): Step => (f === "salePrice" || f === "variableCost" ? "product" : "fixed")

const LABELS: Record<Field, { lcd: string; aria: string }> = {
  amount: { lcd: "MONTO AL MES", aria: "Monto del costo fijo al mes" },
  salePrice: { lcd: "PRECIO DE VENTA", aria: "Precio de venta de un producto" },
  variableCost: { lcd: "COSTO VARIABLE", aria: "Costo variable de un producto" },
}

const toRaw = (n: number | null | undefined) => (n != null && Number.isFinite(n) && n > 0 ? String(Math.round(n)) : "")

/** Huella de los datos escritos (lista incluida): dice si hay algo sin guardar y si ya se guardó. */
const signature = (items: FixedItem[], v: Record<Field, number | null>) =>
  FIELD_ORDER.map((k) => v[k] ?? "").join("|") + "#" + JSON.stringify(items)

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

/**
 * Pantalla de "Nuevo cálculo": la calculadora ES el proceso. Dos pasos —
 * costos fijos (lista libre: el usuario nombra un costo, teclea el monto
 * y lo agrega; el total se suma solo) y el producto (precio y costo
 * variable). Calcular muestra unidades y ventas por mes y por día; solo
 * entonces se puede guardar.
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
  const [boot] = useState<Record<Field, string>>(() => {
    const values: Record<Field, string> = { amount: "", salePrice: "", variableCost: "" }
    if (!fixedOnly) {
      values.salePrice = toRaw(initialRecord?.salePrice)
      values.variableCost = toRaw(initialRecord?.variableCost)
    }
    return values
  })

  // Lista libre de costos fijos del paso 1 (los del registro precargado se muestran tal cual).
  const [fixedItems, setFixedItems] = useState<FixedItem[]>(() =>
    (initialRecord?.fixedCosts ?? [])
      .filter((c) => c.amount > 0 && c.name.trim() !== "")
      .map((c) => ({ name: c.name, amount: c.amount })),
  )
  const [itemName, setItemName] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const fixedTotal = fixedItems.reduce((s, c) => s + c.amount, 0)

  /** Fórmula del módulo sobre el total de la lista actual. */
  function solve(v: Record<Field, number | null>): Outcome {
    if (fixedTotal <= 0) {
      return { ok: false, field: "amount", message: "Agrega al menos un costo fijo a la lista" }
    }
    const r = solveBreakEven({ fixedCosts: fixedTotal, salePrice: v.salePrice, variableCost: v.variableCost })
    if (r.ok) return r
    const field: Field = r.field === "fixedCosts" ? "amount" : r.field
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

  const calc = useSolverCalculator<Field, Outcome>({ entry: ENTRY, initial: boot, first: "amount", solve })
  const [step, setStep] = useState<Step>("fixed")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [note, setNote] = useState(prefillNote)
  const [clearArmed, setClearArmed] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  // Con qué datos se abrió o qué se guardó por última vez: contra eso se mide "sin guardar".
  const [baseline, setBaseline] = useState(() =>
    signature(
      fixedItems,
      Object.fromEntries(FIELD_ORDER.map((k) => [k, parseEntry(boot[k])])) as Record<Field, number | null>,
    ),
  )
  const [savedSig, setSavedSig] = useState<string | null>(null)
  const savingRef = useRef(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const registerRefs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({})

  const result = calc.outcome?.ok ? calc.outcome : null
  const error = calc.outcome && !calc.outcome.ok ? calc.outcome : null
  const hasData = fixedItems.length > 0 || itemName.trim() !== "" || FIELD_ORDER.some((k) => calc.inputs[k] != null)

  const sig = signature(fixedItems, calc.inputs)
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

  // "Limpiar" borra la lista y los datos de golpe: hay que tocarlo dos veces.
  useEffect(() => {
    if (!clearArmed) return
    const t = window.setTimeout(() => setClearArmed(false), 4000)
    return () => window.clearTimeout(t)
  }, [clearArmed])

  function press(key: EntryKey) {
    setClearArmed(false)
    setAddError(null)
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
    setFixedItems([])
    setItemName("")
    setAddError(null)
    setStep("fixed")
  }

  /** "Empezar en blanco" del aviso: descarta lo precargado sin pedir doble toque. */
  function startBlank() {
    setClearArmed(false)
    setNote(null)
    calc.clearAll()
    setFixedItems([])
    setItemName("")
    setAddError(null)
    setStep("fixed")
    setBaseline(signature([], Object.fromEntries(FIELD_ORDER.map((k) => [k, null])) as Record<Field, number | null>))
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
    setAddError(null)
    const r = calc.calculate()
    if (!r.ok) {
      setStep(stepOf(r.field))
      focusField(r.field)
      return
    }
    setResultOpen(true)
  }

  function goTo(field: Field) {
    setAddError(null)
    setStep(stepOf(field))
    calc.activate(field)
  }

  function goStep(next: Step) {
    const field: Field = next === "fixed" ? "amount" : "salePrice"
    setAddError(null)
    setStep(next)
    calc.activate(field)
    focusField(field)
  }

  /** Pasa el costo escrito (nombre + monto) a la lista del paso 1. */
  function addItem() {
    setClearArmed(false)
    const name = itemName.trim()
    const amount = calc.inputs.amount ?? 0
    if (!name) {
      setAddError("Escribe un nombre para el costo (ej. Arriendo)")
      nameRef.current?.focus()
      return
    }
    if (!(amount > 0)) {
      setAddError("Falta el monto: escríbelo con el teclado de la calculadora")
      focusField("amount")
      return
    }
    setFixedItems((prev) => [...prev, { name, amount }])
    setItemName("")
    setAddError(null)
    calc.fill({ amount: "" })
    nameRef.current?.focus()
  }

  /** Quita un costo de la lista; un resultado previo deja de valer. */
  function removeItem(index: number) {
    setClearArmed(false)
    setAddError(null)
    setFixedItems((prev) => prev.filter((_, i) => i !== index))
    calc.fill({})
  }

  /** Enter: en el paso 1 agrega el costo a la lista; en el 2 pasa al siguiente dato o calcula. */
  function advance() {
    if (step === "fixed") {
      addItem()
      return
    }
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
          setAddError(null)
          calc.setRaw(key, raw)
        }}
        onEnter={advance}
      />
    )
  }

  // Pantalla: total de la lista mientras se llena; unidades al calcular.
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
        ? "Nombra tu primer costo y agrégalo a la lista"
        : "Falta anotar tus costos fijos (paso 1)"
      : step === "fixed"
        ? `${fixedItems.length} en la lista · se suma solo`
        : missingProduct.length > 0
          ? `Falta ${missingProduct.join(" y ")}`
          : "Pulsa Calcular"
  let announce = ""
  if (addError) {
    tone = "error"
    sub = addError
    announce = addError
  } else if (result) {
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
        fixedCosts: fixedItems.map((c) => ({ ...c })),
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
            <section className={styles.fixedSection} aria-label="Escribe un costo fijo">
              <div className={styles.fixedNameBox}>
                <label className={styles.fixedNameLabel} htmlFor="be-fixed-name">
                  NOMBRE DEL COSTO
                </label>
                <input
                  ref={nameRef}
                  id="be-fixed-name"
                  className={styles.fixedName}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Ej. Arriendo, Agua, Teléfonos…"
                  aria-label="Nombre del costo fijo"
                  aria-invalid={addError ? true : undefined}
                  aria-describedby={addError ? "be-message" : undefined}
                  value={itemName}
                  onChange={(e) => {
                    setAddError(null)
                    setItemName(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addItem()
                    }
                  }}
                />
              </div>
              {renderRegister("amount", "block")}
            </section>
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

          {step === "fixed" ? (
            <button type="button" className="calc-key calc-key-equals" onClick={addItem}>
              Agregar a la lista
            </button>
          ) : (
            <button type="button" className="calc-key calc-key-equals" onClick={calculate}>
              Calcular
            </button>
          )}
        </CalcDevice>

        {step === "fixed" && (
          <Button variant="ghost" onClick={() => goStep("product")} className="w-full">
            Siguiente: tu producto
            <ArrowRight size={15} />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        <>
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Wallet size={18} style={{ color: "var(--accent)" }} />
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Costos fijos del mes
                  </h2>
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatCOP(fixedTotal)}
                </span>
              </div>
              {fixedItems.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Aún no has agregado costos. Nombra el primero en la calculadora y pulsa Agregar a la lista.
                </p>
              ) : (
                <ul className={styles.fixedList}>
                  {fixedItems.map((item, i) => (
                    <li key={`${i}-${item.name}`} className={styles.fixedItem}>
                      <span className={styles.fixedItemName}>{item.name}</span>
                      <span className={styles.fixedItemAmount}>{formatCOP(item.amount)}</span>
                      <button
                        type="button"
                        className={styles.fixedItemRemove}
                        onClick={() => removeItem(i)}
                        aria-label={`Quitar ${item.name}`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
                  <strong style={{ color: "var(--text-primary)" }}>Costos fijos.</strong> Escribe el nombre del gasto
                  (arriendo, sueldos, agua, energía, gas, teléfonos, marketing digital, impuestos u otros), teclea el
                  monto del mes con el teclado y pulsa{" "}
                  <strong style={{ color: "var(--text-primary)" }}>Agregar a la lista</strong>. El costo aparece en la
                  lista de la derecha y el total se suma solo.
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
              Con el teclado del computador también puedes escribir: en el paso 1, Enter agrega el costo a la lista y en
              el paso 2 pasa al siguiente dato. Al tocar un dato que ya tiene valor, lo primero que escribas lo
              reemplaza.
            </p>
            </div>
          </>
      </div>

      {/* ── Modal: resultado del cálculo (mismo patrón que el módulo Menú) ── */}
      <Modal
        open={resultOpen && result !== null}
        onClose={() => setResultOpen(false)}
        title="Resultado del cálculo"
        wide
        blur
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              {saved && (
                <span role="status" className="text-sm flex items-center gap-1.5" style={{ color: "#166534" }}>
                  <CheckCircle2 size={14} />
                  Guardado: ya aparece primero en tu historial
                </span>
              )}
              {saveError && !saved && (
                <span role="alert" className="text-xs break-words" style={{ color: "var(--error)" }}>{saveError}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setResultOpen(false)}>
                Cerrar
              </Button>
              {saved ? (
                <Button variant="primary" className="w-full sm:w-auto" onClick={onDone}>
                  Ver historial
                </Button>
              ) : (
                <Button variant="primary" className="w-full sm:w-auto" onClick={handleSave} loading={saving}>
                  Guardar cálculo
                </Button>
              )}
            </div>
          </div>
        }
      >
        {result && (
          <BreakEvenFicha
            data={{
              unitsPerMonth: result.unitsPerMonth,
              unitsPerDay: result.unitsPerDay,
              revenuePerMonth: result.revenuePerMonth,
              revenuePerDay: result.revenuePerDay,
              fixedTotal: result.fixedCosts,
              salePrice: result.salePrice,
              variableCost: result.variableCost,
              contributionMargin: result.contributionMargin,
              fixedCosts: fixedItems,
            }}
          />
        )}
      </Modal>
    </div>
  )
}

"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, Plus, X } from "lucide-react"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { CalcActionKey, CalcDevice, CalcDisplay, CalcKeypad, CalcRegister, useCalcRegisters } from "@/components/calculator"
import { entryKeyFromKeyboard, formatMoneyEntry, parseEntry, type EntryOptions } from "@/lib/calculator/entry"
import { formatCOP } from "@/lib/calculator/format"
import { contributionMarginOf, missingBreakEvenInputs, solveBreakEven, type BreakEvenOutcome } from "@/lib/calculator/breakEven"
import {
  BLANK_SIGNATURE,
  COST_NAME_MAX,
  PRICE_FIELD,
  VARIABLE_FIELD,
  calcPhase,
  fixedCostsFromFields,
  inputsSignature as signature,
  prefillCostFields,
  sumCostFields,
  type CostField,
} from "@/lib/calculator/breakEvenFields"
import type { BreakEvenRecord } from "@/types/domain"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import BreakEvenTicket from "./BreakEvenTicket"
import styles from "./breakEven.module.css"

export interface BreakEvenSubmitData {
  fixedCosts: { name: string; amount: number }[]
  salePrice: number
  variableCost: number
}

// Pesos enteros, hasta 9 dígitos ("$ 999.999.999"): todos los campos usan la misma regla.
const MONEY: EntryOptions = { decimals: false, maxDigits: 9 }
const ANY_MONEY = new Proxy({} as Record<string, EntryOptions>, { get: () => MONEY })

/** Rótulo corto para la tecla (cabe en una rejilla de 3); el nombre completo queda en aria-label. */
const RUBRO_SHORT: Record<string, string> = { marketing: "Marketing" }

/** Campo del monto que se está escribiendo (todavía no está en la lista). */
const AMOUNT_FIELD = "amount"

const toRaw = (n: number | null | undefined) => (n != null && Number.isFinite(n) && n > 0 ? String(Math.round(n)) : "")

export type LiveOutcome =
  | { ok: true; result: Extract<BreakEvenOutcome, { ok: true }> }
  | { ok: false; kind: "empty" | "invalid"; message: string }

/**
 * Resultado en vivo a partir de lo escrito: usa solveBreakEven (fórmula validada
 * contra el Excel) y traduce cada fallo a un motivo claro. Jamás devuelve una
 * cifra si no puede calcularse.
 */
export function solveLive(fixedTotal: number, salePrice: number | null, variableCost: number | null): LiveOutcome {
  const inputs = { fixedCosts: fixedTotal > 0 ? fixedTotal : null, salePrice, variableCost }
  const missing = missingBreakEvenInputs(inputs)
  if (missing.length > 0) {
    const parts = missing.map((f) =>
      f === "fixedCosts"
        ? "agrega al menos un costo fijo"
        : f === "salePrice"
          ? "escribe el precio de venta"
          : "escribe el costo variable (0 si no tiene insumos)",
    )
    const text = parts.join(" y ")
    return { ok: false, kind: "empty", message: text.charAt(0).toUpperCase() + text.slice(1) }
  }
  const r = solveBreakEven(inputs)
  if (r.ok) return { ok: true, result: r }
  if (r.reason === "invalid" && r.field === "salePrice" && salePrice != null && variableCost != null) {
    return {
      ok: false,
      kind: "invalid",
      message: `El precio (${formatCOP(salePrice)}) debe ser mayor al costo variable (${formatCOP(variableCost)}); si no, no ganas nada por unidad.`,
    }
  }
  return { ok: false, kind: "invalid", message: r.message }
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

/**
 * "Nuevo cálculo" en dos pasos, sin texto de instrucciones:
 *  1. Costos fijos: se elige el rubro (Arriendo, Sueldos…), se teclea el monto y
 *     «Agregar a la lista». No se escribe ningún nombre; la lista crece a la derecha.
 *  2. Tu producto: precio de venta y costo variable, y «Calcular».
 * El resultado se despliega como un boleto bajo la lista (como en Valoración) y luego se guarda.
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
  const uid = useId()
  const confirm = useConfirm()

  const [boot] = useState(() => {
    const pre = prefillCostFields(initialRecord?.fixedCosts ?? [])
    const withProduct = !fixedOnly && initialRecord
    const amounts: Record<string, number> = {}
    const listed: string[] = []
    for (const f of pre.fields) {
      const n = parseEntry(pre.values[f.id] ?? "") ?? 0
      if (n > 0) {
        amounts[f.id] = n
        listed.push(f.id)
      }
    }
    return {
      fields: pre.fields,
      amounts,
      listed,
      values: {
        [AMOUNT_FIELD]: "",
        [PRICE_FIELD]: withProduct ? toRaw(initialRecord.salePrice) : "",
        // El costo variable puede ser 0 (sin insumos): "0" es un dato válido, vacío no.
        [VARIABLE_FIELD]: withProduct ? String(Math.max(0, Math.round(initialRecord.variableCost))) : "",
      } as Record<string, string>,
    }
  })

  // Los rubros (y los que traiga un registro viejo con otro nombre) son fijos: no se escribe ningún nombre.
  const [fields, setFields] = useState<CostField[]>(boot.fields)
  const [amounts, setAmounts] = useState<Record<string, number>>(boot.amounts)
  // Orden en que se fueron agregando: es el orden de la lista de la derecha.
  const [listed, setListed] = useState<string[]>(boot.listed)
  const [cat, setCat] = useState<string>(() => boot.fields.find((f) => !boot.listed.includes(f.id))?.id ?? boot.fields[0].id)
  const [step, setStep] = useState<"fixed" | "product">(() =>
    boot.listed.length > 0 && boot.values[PRICE_FIELD] !== "" ? "product" : "fixed",
  )

  // «Nuevo concepto»: único caso en que se escribe un nombre (lo que no cabe en los rubros fijos)
  const [naming, setNaming] = useState(false)
  const [draftName, setDraftName] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)
  const nextExtra = useRef(boot.fields.filter((f) => !f.preset).length + 1)

  const calc = useCalcRegisters<string>(
    ANY_MONEY,
    boot.values,
    boot.listed.length > 0 && boot.values[PRICE_FIELD] !== "" ? PRICE_FIELD : AMOUNT_FIELD,
  )
  const { values, active } = calc
  const registerRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Los montos de la lista como dígitos crudos: lo que esperan las funciones de breakEvenFields.
  const costValues: Record<string, string> = {
    ...Object.fromEntries(fields.map((f) => [f.id, amounts[f.id] ? String(amounts[f.id]) : ""])),
    [PRICE_FIELD]: values[PRICE_FIELD] ?? "",
    [VARIABLE_FIELD]: values[VARIABLE_FIELD] ?? "",
  }

  const [note, setNote] = useState(prefillNote)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [baseline, setBaseline] = useState(() => signature(boot.fields, { ...Object.fromEntries(boot.fields.map((f) => [f.id, boot.amounts[f.id] ? String(boot.amounts[f.id]) : ""])), ...boot.values }))
  const [savedSig, setSavedSig] = useState<string | null>(null)
  // Huella de los datos con los que se pulsó «Calcular». Con un registro precargado
  // y válido arranca ya calculada (boleto visible, sin animación de entrada).
  const [calculatedSig, setCalculatedSig] = useState<string | null>(() => {
    const total = Object.values(boot.amounts).reduce((a, b) => a + b, 0)
    const ok = solveLive(total, parseEntry(boot.values[PRICE_FIELD] ?? ""), parseEntry(boot.values[VARIABLE_FIELD] ?? "")).ok
    const vals = {
      ...Object.fromEntries(boot.fields.map((f) => [f.id, boot.amounts[f.id] ? String(boot.amounts[f.id]) : ""])),
      ...boot.values,
    }
    return initialRecord && ok ? signature(boot.fields, vals) : null
  })
  // El boleto solo se anima si el usuario pulsó «Calcular» (no al precargar).
  const [animate, setAnimate] = useState(false)
  // Motivo del último intento fallido; vale solo mientras los datos no cambien.
  const [failed, setFailed] = useState<{ sig: string; message: string } | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const answerRef = useRef<HTMLElement>(null)

  const fixedTotal = sumCostFields(fields, costValues)
  const salePrice = parseEntry(values[PRICE_FIELD] ?? "")
  const variableCost = parseEntry(values[VARIABLE_FIELD] ?? "")
  const margin = contributionMarginOf(salePrice, variableCost)
  const live = solveLive(fixedTotal, salePrice, variableCost)
  const marginBad = margin !== null && margin <= 0

  const sig = signature(fields, costValues)
  const phase = calcPhase(calculatedSig, sig)
  // Boleto solo si se calculó con estos mismos datos y siguen siendo válidos.
  const result = phase === "ready" && live.ok ? live.result : null
  const dirty = sig !== baseline
  const saved = result !== null && savedSig === sig
  const hasData = sig !== BLANK_SIGNATURE
  const canSave = result !== null && !saved && !saving
  const draft = parseEntry(values[AMOUNT_FIELD] ?? "") ?? 0
  const catName = fields.find((f) => f.id === cat)?.name ?? ""

  useEffect(() => {
    if (naming) nameRef.current?.focus()
  }, [naming])

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  // Recargar o cerrar la pestaña con datos sin guardar: el navegador avisa.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Teclado físico sin hacer clic en un campo primero: si el foco no está en otro
  // control de texto (ni hay un diálogo abierto), las teclas numéricas escriben
  // en el campo activo, como en Valoración y Factor de rendimiento.
  const live_ = useRef({ active, press: calc.press })
  useEffect(() => {
    live_.current = { active, press: calc.press }
  })
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="listbox"]')) return
      const dialog = document.querySelector('[aria-modal="true"]')
      if (dialog && !dialog.contains(document.querySelector('[data-break-even-device]'))) return
      const key = entryKeyFromKeyboard(e.key)
      if (!key) return
      e.preventDefault()
      const c = live_.current
      registerRefs.current[c.active]?.focus({ preventScroll: true })
      c.press(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function focusField(id: string) {
    calc.activate(id)
    registerRefs.current[id]?.focus({ preventScroll: true })
  }

  function goStep(next: "fixed" | "product") {
    setStep(next)
    setDraftError(null)
    calc.activate(next === "fixed" ? AMOUNT_FIELD : PRICE_FIELD)
  }

  function chooseCat(id: string) {
    setNaming(false)
    setCat(id)
    setDraftError(null)
    calc.activate(AMOUNT_FIELD)
  }

  function startNew() {
    setDraftName("")
    setDraftError(null)
    setNaming(true)
  }

  /** Crea el concepto con el nombre escrito (o elige el que ya existe con ese nombre) y lo deja elegido. */
  function commitName() {
    const name = draftName.trim().slice(0, COST_NAME_MAX)
    setNaming(false)
    if (name === "") return
    const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
    const existing = fields.find((f) => norm(f.name) === norm(name))
    if (existing) setCat(existing.id)
    else {
      const id = `x${nextExtra.current++}`
      setFields((prev) => [...prev, { id, name, preset: false }])
      setCat(id)
    }
    focusField(AMOUNT_FIELD)
  }

  /** «Agregar a la lista»: suma el monto al rubro elegido (si ya estaba, se acumula) y pasa al siguiente rubro libre. */
  function addToList() {
    if (draft <= 0) {
      setDraftError(`Escribe cuánto pagas al mes por ${catName.toLowerCase()}`)
      focusField(AMOUNT_FIELD)
      return
    }
    setDraftError(null)
    setAmounts((prev) => ({ ...prev, [cat]: (prev[cat] ?? 0) + draft }))
    const nextListed = listed.includes(cat) ? listed : [...listed, cat]
    setListed(nextListed)
    calc.assign({ [AMOUNT_FIELD]: "" })
    const idx = fields.findIndex((f) => f.id === cat)
    const free = [...fields.slice(idx + 1), ...fields.slice(0, idx)].find((f) => !nextListed.includes(f.id))
    if (free) setCat(free.id)
    focusField(AMOUNT_FIELD)
  }

  function removeCost(id: string) {
    setAmounts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setListed((prev) => prev.filter((x) => x !== id))
  }

  function resetAll() {
    const base = prefillCostFields([])
    setFields(base.fields)
    nextExtra.current = 1
    setNaming(false)
    setAmounts({})
    setListed([])
    setCat(base.fields[0].id)
    calc.assign({ [AMOUNT_FIELD]: "", [PRICE_FIELD]: "", [VARIABLE_FIELD]: "" })
    setStep("fixed")
    calc.activate(AMOUNT_FIELD)
    setNote(null)
    setSavedSig(null)
    setBaseline(BLANK_SIGNATURE)
    setCalculatedSig(null)
    setFailed(null)
    setDraftError(null)
    setAnimate(false)
  }

  /** «Calcular»: valida con solveLive; si es válido muestra el boleto, si no avisa el motivo. */
  function handleCalculate() {
    if (phase === "ready" && result) return
    if (!live.ok) {
      setFailed({ sig, message: live.message })
      toast.warning("No se puede calcular todavía", { description: live.message })
      if (fixedTotal <= 0) goStep("fixed")
      else focusField(salePrice === null || salePrice <= 0 ? PRICE_FIELD : VARIABLE_FIELD)
      return
    }
    setFailed(null)
    setAnimate(true)
    setCalculatedSig(sig)
    // En una columna el boleto queda debajo de la calculadora: llévalo a la vista.
    requestAnimationFrame(() => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      answerRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" })
    })
  }

  async function handleClear() {
    // Limpiar con un monto a medio escribir borra solo ese monto, no todo el cálculo.
    if (step === "fixed" && (values[AMOUNT_FIELD] ?? "") !== "") {
      calc.assign({ [AMOUNT_FIELD]: "" })
      return
    }
    if (hasData) {
      const ok = await confirm({
        title: "Empezar un cálculo nuevo",
        description: "Se borrarán los costos y los datos de tu producto que escribiste.",
        confirmLabel: "Borrar y empezar",
        cancelLabel: "Seguir editando",
        variant: "danger",
      })
      if (!ok) return
    }
    resetAll()
  }

  async function handleSave() {
    if (!result || !canSave || savingRef.current) return
    savingRef.current = true
    const savingSig = sig
    setSaving(true)
    try {
      await onSubmit({
        fixedCosts: fixedCostsFromFields(fields, costValues),
        salePrice: result.salePrice,
        variableCost: result.variableCost,
      })
      setSavedSig(savingSig)
      setBaseline(savingSig)
    } catch (e) {
      toast.error("No se pudo guardar el cálculo", {
        description: `${friendlyError(e, "Revisa tu conexión.")} Tus datos siguen aquí: intenta guardar de nuevo.`,
      })
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const msgId = `${uid}-msg`
  const errorOn = (id: string) => marginBad && (id === PRICE_FIELD || id === VARIABLE_FIELD)

  function register(
    id: string,
    props: { label: string; ariaLabel: string; variant?: "block" | "inline"; note?: React.ReactNode },
  ) {
    return (
      <CalcRegister
        ref={(el) => {
          registerRefs.current[id] = el
        }}
        id={`${uid}-${id}`}
        label={props.label}
        ariaLabel={props.ariaLabel}
        display={formatMoneyEntry(values[id] ?? "")}
        placeholder="$ 0"
        active={active === id}
        fresh={calc.fresh}
        error={errorOn(id) || (id === AMOUNT_FIELD && !!draftError)}
        describedBy={errorOn(id) || (id === AMOUNT_FIELD && draftError) ? msgId : undefined}
        variant={props.variant ?? "block"}
        note={props.note}
        onActivate={() => calc.activate(id)}
        onKey={calc.press}
        onRawInput={(raw) => {
          if (id === AMOUNT_FIELD) setDraftError(null)
          calc.setRaw(id, raw)
        }}
        onEnter={() => {
          if (id === AMOUNT_FIELD) addToList()
          else if (id === PRICE_FIELD) focusField(VARIABLE_FIELD)
          // Último dato: Enter = Calcular
          else handleCalculate()
        }}
      />
    )
  }

  // Solo avisos útiles. Sin aviso no se dibuja la línea.
  const failedNow = failed && failed.sig === sig ? failed.message : null
  let status = ""
  let statusError = true
  if (step === "fixed" && draftError) status = draftError
  else if (step === "product") {
    if (saved) {
      status = "Cálculo guardado."
      statusError = false
    } else if (failedNow) status = failedNow
    else if (marginBad && !live.ok && live.kind === "invalid") status = live.message
  }

  const nameOf = (id: string) => fields.find((f) => f.id === id)?.name ?? ""

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {note && (
        <div
          className="flex flex-col gap-2 rounded-xl p-3 text-sm sm:flex-row sm:items-center"
          style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        >
          <p className="flex-1">{note}</p>
          <Button variant="ghost" size="sm" onClick={resetAll} className="shrink-0">
            Empezar en blanco
          </Button>
        </div>
      )}

      <div className={styles.stage}>
        <div className={styles.workspace}>
          <div className={styles.left}>
            {/* Los dos pasos, siempre a la vista: dicen dónde estás y lo que ya llevas */}
            <div className={styles.steps} role="tablist" aria-label="Pasos del cálculo">
              <button
                type="button"
                role="tab"
                aria-selected={step === "fixed"}
                className={styles.stepTab}
                data-current={step === "fixed" || undefined}
                onClick={() => goStep("fixed")}
              >
                <span className={styles.stepNum} data-done={fixedTotal > 0 || undefined}>
                  {fixedTotal > 0 ? <Check size={12} aria-hidden /> : 1}
                </span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>Costos fijos</span>
                  <span className={styles.stepSub}>{fixedTotal > 0 ? formatCOP(fixedTotal) : "Sin costos"}</span>
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={step === "product"}
                className={styles.stepTab}
                data-current={step === "product" || undefined}
                onClick={() => goStep("product")}
              >
                <span className={styles.stepNum} data-done={(salePrice ?? 0) > 0 || undefined}>
                  {(salePrice ?? 0) > 0 ? <Check size={12} aria-hidden /> : 2}
                </span>
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>Tu producto</span>
                  <span className={styles.stepSub}>{(salePrice ?? 0) > 0 ? `Vende a ${formatCOP(salePrice ?? 0)}` : "Precio y costo"}</span>
                </span>
              </button>
            </div>

            <div className={styles.device} data-break-even-device>
              <CalcDevice label="Calculadora de punto de equilibrio">
                <CalcDisplay
                  label="COSTOS FIJOS DEL MES"
                  value={formatCOP(fixedTotal)}
                  tone={fixedTotal > 0 ? "result" : "idle"}
                  announce={fixedTotal > 0 ? `Costos fijos del mes: ${formatCOP(fixedTotal)}` : ""}
                />

                {step === "fixed" ? (
                  <>
                    {/* El rubro se elige, no se escribe: teclas de función en rejilla de 3, la elegida queda hundida */}
                    <div className={styles.rubros} role="group" aria-label="Tipo de costo fijo">
                      {fields.map((f) => (
                          <div key={f.id} className="calc-slot">
                            <button
                              type="button"
                              className="calc-key calc-key-fn"
                              aria-pressed={cat === f.id}
                              aria-label={listed.includes(f.id) ? `${f.name} (ya agregado)` : f.name}
                              data-listed={listed.includes(f.id) || undefined}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => chooseCat(f.id)}
                            >
                              <span className={styles.keyLabel}>{RUBRO_SHORT[f.id] ?? f.name}</span>
                            </button>
                          </div>
                      ))}
                      <div className={`calc-slot ${styles.newSlot}`}>
                        <button
                          type="button"
                          className="calc-key calc-key-fn"
                          aria-expanded={naming}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={startNew}
                        >
                          <Plus size={14} aria-hidden />
                          <span className={styles.keyLabel}>Nuevo concepto</span>
                        </button>
                      </div>
                    </div>

                    {naming && (
                      <div className={styles.rename}>
                        <input
                          ref={nameRef}
                          className={styles.renameInput}
                          type="text"
                          value={draftName}
                          maxLength={COST_NAME_MAX}
                          autoComplete="off"
                          placeholder="Nombre del costo"
                          aria-label="Nombre del nuevo concepto"
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={(e) => {
                            e.nativeEvent.stopPropagation()
                            if (e.key === "Enter") {
                              e.preventDefault()
                              commitName()
                            } else if (e.key === "Escape") {
                              e.preventDefault()
                              setNaming(false)
                            }
                          }}
                        />
                        <button type="button" className={styles.renameOk} onClick={commitName}>
                          Listo
                        </button>
                      </div>
                    )}

                    <div className={styles.product}>
                      {register(AMOUNT_FIELD, {
                        label: catName.toUpperCase(),
                        ariaLabel: `Monto de ${catName} al mes`,
                                      })}
                    </div>

                    <div className={`calc-keypad-slot ${styles.keypad}`}>
                      <CalcKeypad onKey={calc.press} onClearAll={handleClear} decimalEnabled={false} />
                    </div>

                    <CalcActionKey onClick={addToList}>Agregar a la lista</CalcActionKey>
                    {listed.length > 0 && (
                      <CalcActionKey variant="fn" className={styles.nextKey} onClick={() => goStep("product")}>
                        Tu producto →
                      </CalcActionKey>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.product}>
                      {register(PRICE_FIELD, {
                        label: "Precio de venta",
                        ariaLabel: "Precio de venta por unidad",
                                      })}
                      {register(VARIABLE_FIELD, {
                        label: "Costo variable por unidad",
                        ariaLabel: "Costo variable por unidad",
                        note: <span>0 si no tiene insumos</span>,
                      })}
                    </div>

                    <div className={`calc-keypad-slot ${styles.keypad}`}>
                      <CalcKeypad onKey={calc.press} onClearAll={handleClear} decimalEnabled={false} />
                    </div>

                    {saved ? (
                      <CalcActionKey onClick={onDone}>Ver historial</CalcActionKey>
                    ) : result ? (
                      <CalcActionKey onClick={handleSave} disabled={!canSave} aria-busy={saving || undefined}>
                        {saving ? "Guardando…" : "Guardar"}
                      </CalcActionKey>
                    ) : (
                      <CalcActionKey onClick={handleCalculate}>Calcular</CalcActionKey>
                    )}
                  </>
                )}
                {status && (
                  <p id={msgId} className={styles.status} data-tone={statusError ? "error" : undefined} role={statusError ? "alert" : "status"}>
                    {status}
                  </p>
                )}
              </CalcDevice>
            </div>
          </div>

          <div className={styles.side}>
            {/* La lista que se va armando: cada «Agregar» cae aquí */}
            <section className={styles.costsCard} aria-label="Costos fijos del mes">
              <header className={styles.costsHead}>
                <h2 className={styles.costsTitle}>Costos fijos del mes</h2>
                <span className={styles.costsTotal}>{formatCOP(fixedTotal)}</span>
              </header>
              {listed.length === 0 ? (
                <p className={styles.costsEmpty}>Sin costos todavía</p>
              ) : (
                <ul className={styles.costsList}>
                  {listed.map((id) => (
                    <li key={id} className={styles.costRow}>
                      <span className={styles.costName}>{nameOf(id)}</span>
                      <span className={styles.costAmount}>{formatCOP(amounts[id] ?? 0)}</span>
                      <button
                        type="button"
                        className={styles.costRemove}
                        aria-label={`Quitar ${nameOf(id)}`}
                        title="Quitar"
                        onClick={() => removeCost(id)}
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              ref={answerRef}
              className={styles.answer}
              data-state={result ? "result" : "idle"}
              aria-labelledby={`${uid}-q`}
            >
              <header className={styles.question}>
                <h2 id={`${uid}-q`} className={styles.questionTitle}>
                  ¿Cuántas unidades debo vender?
                </h2>
                <p className={styles.questionHint}>Las que cubren todos tus costos del mes: desde ahí empiezas a ganar.</p>
              </header>
              {!result && (
                <div className="calc-receipt-placeholder" aria-hidden>
                  El resultado aparecerá aquí cuando pulses Calcular
                </div>
              )}
              {result && (
                <div className={animate ? undefined : styles.still}>
                  <BreakEvenTicket
                    result={result}
                    fixedTotal={fixedTotal}
                    salePrice={salePrice}
                    variableCost={variableCost}
                    margin={margin}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

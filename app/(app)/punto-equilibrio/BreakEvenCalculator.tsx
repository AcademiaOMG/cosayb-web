"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Pencil, Plus, X } from "lucide-react"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { CalcActionKey, CalcDevice, CalcDisplay, CalcKeypad, CalcRegister, useCalcRegisters } from "@/components/calculator"
import { entryKeyFromKeyboard, formatMoneyEntry, parseEntry, type EntryOptions } from "@/lib/calculator/entry"
import { formatCOP } from "@/lib/calculator/format"
import { contributionMarginOf, missingBreakEvenInputs, solveBreakEven, type BreakEvenOutcome } from "@/lib/calculator/breakEven"
import {
  BLANK_SIGNATURE,
  COST_NAME_MAX,
  NEW_COST_NAME,
  PRICE_FIELD,
  VARIABLE_FIELD,
  calcPhase,
  fixedCostsFromFields,
  inputsSignature as signature,
  prefillCostFields,
  presetCostFields,
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
 * "Nuevo cálculo": la calculadora del kit en dos columnas (costos fijos a la izquierda;
 * precio, costo variable, teclado y Calcular/Guardar a la derecha) y, al lado o debajo, el boleto de resultados. El
 * resultado aparece al pulsar Calcular (como en Valoración) y luego se guarda.
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
    return {
      fields: pre.fields,
      nextExtra: pre.nextExtra,
      values: {
        ...pre.values,
        [PRICE_FIELD]: withProduct ? toRaw(initialRecord.salePrice) : "",
        // El costo variable puede ser 0 (sin insumos): "0" es un dato válido, vacío no.
        [VARIABLE_FIELD]: withProduct ? String(Math.max(0, Math.round(initialRecord.variableCost))) : "",
      } as Record<string, string>,
    }
  })

  const [fields, setFields] = useState<CostField[]>(boot.fields)
  const nextExtra = useRef(boot.nextExtra)
  const calc = useCalcRegisters<string>(ANY_MONEY, boot.values, boot.fields[0].id)
  const { values, active } = calc

  const [renaming, setRenaming] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const renameRef = useRef<HTMLInputElement>(null)
  const registerRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const [note, setNote] = useState(prefillNote)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [baseline, setBaseline] = useState(() => signature(boot.fields, boot.values))
  const [savedSig, setSavedSig] = useState<string | null>(null)
  // Huella de los datos con los que se pulsó «Calcular». Con un registro precargado
  // y válido arranca ya calculada (boleto visible, sin animación de entrada).
  const [calculatedSig, setCalculatedSig] = useState<string | null>(() => {
    const total = sumCostFields(boot.fields, boot.values)
    const ok = solveLive(total, parseEntry(boot.values[PRICE_FIELD] ?? ""), parseEntry(boot.values[VARIABLE_FIELD] ?? "")).ok
    return initialRecord && ok ? signature(boot.fields, boot.values) : null
  })
  // El boleto solo se anima si el usuario pulsó «Calcular» (no al precargar).
  const [animate, setAnimate] = useState(false)
  // Motivo del último «Calcular» fallido; vale solo mientras los datos no cambien.
  const [failed, setFailed] = useState<{ sig: string; message: string } | null>(null)
  const answerRef = useRef<HTMLElement>(null)

  const fixedTotal = sumCostFields(fields, values)
  const salePrice = parseEntry(values[PRICE_FIELD] ?? "")
  const variableCost = parseEntry(values[VARIABLE_FIELD] ?? "")
  const margin = contributionMarginOf(salePrice, variableCost)
  const live = solveLive(fixedTotal, salePrice, variableCost)
  const marginBad = margin !== null && margin <= 0

  // Todo costo con monto necesita nombre para quedar en el historial.
  const unnamed = fields.some((f) => (parseEntry(values[f.id] ?? "") ?? 0) > 0 && f.name.trim() === "")
  const sig = signature(fields, values)
  const phase = calcPhase(calculatedSig, sig)
  // Boleto solo si se calculó con estos mismos datos y siguen siendo válidos.
  const result = phase === "ready" && live.ok ? live.result : null
  const dirty = sig !== baseline
  const saved = result !== null && savedSig === sig
  const hasData = sig !== BLANK_SIGNATURE
  const canSave = result !== null && !unnamed && !saved && !saving

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

  useEffect(() => {
    if (renaming === null) return
    renameRef.current?.focus()
    renameRef.current?.select()
  }, [renaming])

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

  const order = useMemo(() => [...fields.map((f) => f.id), PRICE_FIELD, VARIABLE_FIELD], [fields])

  function focusField(id: string) {
    calc.activate(id)
    registerRefs.current[id]?.focus({ preventScroll: true })
  }

  function addCost() {
    const id = `x${nextExtra.current++}`
    setFields((prev) => [...prev, { id, name: NEW_COST_NAME, preset: false }])
    calc.assign({ [id]: "" })
    calc.activate(id)
    setDraftName(NEW_COST_NAME)
    setRenaming(id)
  }

  function removeCost(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
    calc.assign({ [id]: "" })
    if (renaming === id) setRenaming(null)
    if (active === id) calc.activate(fields[0].id)
  }

  function startRename(f: CostField) {
    setDraftName(f.name)
    setRenaming(f.id)
  }

  function commitRename() {
    if (renaming === null) return
    const name = draftName.trim().slice(0, COST_NAME_MAX)
    // Un nombre vacío no se acepta: se conserva el anterior.
    if (name !== "") setFields((prev) => prev.map((f) => (f.id === renaming ? { ...f, name } : f)))
    setRenaming(null)
  }

  function resetAll() {
    const blank = presetCostFields()
    setFields(blank)
    nextExtra.current = 1
    calc.assign(Object.fromEntries([...order, PRICE_FIELD, VARIABLE_FIELD].map((k) => [k, ""])))
    calc.activate(blank[0].id)
    setRenaming(null)
    setNote(null)
    setSavedSig(null)
    setBaseline(BLANK_SIGNATURE)
    setCalculatedSig(null)
    setFailed(null)
    setAnimate(false)
  }

  /** «Calcular»: valida con solveLive; si es válido muestra el boleto, si no avisa el motivo. */
  function handleCalculate() {
    if (phase === "ready" && result) return
    if (!live.ok) {
      setFailed({ sig, message: live.message })
      toast.warning("No se puede calcular todavía", { description: live.message })
      focusField(
        fixedTotal <= 0 ? fields[0].id : salePrice === null || salePrice <= 0 ? PRICE_FIELD : VARIABLE_FIELD,
      )
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
        fixedCosts: fixedCostsFromFields(fields, values),
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
    props: { label: string; ariaLabel: string; variant?: "block" | "inline"; accessory?: React.ReactNode; note?: React.ReactNode },
  ) {
    const idx = order.indexOf(id)
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
        error={errorOn(id)}
        describedBy={errorOn(id) ? msgId : undefined}
        variant={props.variant ?? "block"}
        accessory={props.accessory}
        note={props.note}
        onActivate={() => calc.activate(id)}
        onKey={calc.press}
        onRawInput={(raw) => calc.setRaw(id, raw)}
        onEnter={() => {
          const next = order[idx + 1]
          if (next) focusField(next)
          // Último campo: Enter = Calcular
          else handleCalculate()
        }}
      />
    )
  }

  // Solo avisos útiles: nada de «Listo para guardar». Sin aviso no se dibuja la línea.
  const failedNow = failed && failed.sig === sig ? failed.message : null
  let status = ""
  let statusError = true
  if (result && unnamed) status = "Ponle nombre a cada costo para poder guardar."
  else if (saved) {
    status = "Cálculo guardado."
    statusError = false
  } else if (failedNow) status = failedNow
  else if (marginBad && !live.ok && live.kind === "invalid") status = live.message

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
          <div className={styles.device} data-break-even-device>
            <CalcDevice label="Calculadora de punto de equilibrio">
              {/* Dos columnas (costos | producto + teclado) cuando la carcasa es ancha; una sola si no */}
              <div className={styles.cols}>
              <div className={styles.colLeft}>
              <CalcDisplay
                label="COSTOS FIJOS DEL MES"
                value={formatCOP(fixedTotal)}
                tone={fixedTotal > 0 ? "result" : "idle"}
                announce={fixedTotal > 0 ? `Costos fijos del mes: ${formatCOP(fixedTotal)}` : ""}
              />

              <div className={styles.fields}>
                {fields.map((f) => (
                  <div key={f.id} className={styles.cost}>
                    {register(f.id, {
                      label: f.name,
                      ariaLabel: `${f.name} al mes`,
                      variant: "inline",
                      accessory: (
                        <span className={styles.tools}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            aria-label={`Renombrar ${f.name}`}
                            title="Cambiar el nombre"
                            onClick={(e) => {
                              e.stopPropagation()
                              startRename(f)
                            }}
                          >
                            <Pencil size={13} aria-hidden />
                          </button>
                          {!f.preset && (
                            <button
                              type="button"
                              className={styles.iconBtn}
                              aria-label={`Quitar ${f.name}`}
                              title="Quitar este costo"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeCost(f.id)
                              }}
                            >
                              <X size={14} aria-hidden />
                            </button>
                          )}
                        </span>
                      ),
                    })}
                    {renaming === f.id && (
                      <div className={styles.rename}>
                        <input
                          ref={renameRef}
                          className={styles.renameInput}
                          type="text"
                          value={draftName}
                          maxLength={COST_NAME_MAX}
                          autoComplete="off"
                          aria-label={`Nombre del costo ${f.name}`}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            // Que el teclado numérico de la calculadora no reaccione a lo que se escribe aquí
                            e.nativeEvent.stopPropagation()
                            if (e.key === "Enter") {
                              e.preventDefault()
                              commitRename()
                              focusField(f.id)
                            } else if (e.key === "Escape") {
                              e.preventDefault()
                              setRenaming(null)
                            }
                          }}
                        />
                        <button type="button" className={styles.renameOk} onMouseDown={(e) => e.preventDefault()} onClick={commitRename}>
                          Listo
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button type="button" className={styles.addCost} onClick={addCost}>
                  <Plus size={14} aria-hidden />
                  Otro costo
                </button>
              </div>
              </div>

              <div className={styles.colRight}>
              <div className={styles.product}>
                {register(PRICE_FIELD, { label: "Precio de venta", ariaLabel: "Precio de venta por unidad" })}
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
              {status && (
                <p id={msgId} className={styles.status} data-tone={statusError ? "error" : undefined} role={statusError ? "alert" : "status"}>
                  {status}
                </p>
              )}
              </div>
              </div>
            </CalcDevice>
          </div>

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
            {result ? (
              <div className={animate ? undefined : styles.still}>
                <BreakEvenTicket
                  result={result}
                  fixedTotal={fixedTotal}
                  salePrice={salePrice}
                  variableCost={variableCost}
                  margin={margin}
                />
              </div>
            ) : (
              <div className="calc-printer" aria-hidden>
                <div className="calc-printer-slot" />
                <div className="calc-receipt-placeholder">
                  {phase === "stale"
                    ? "Cambiaste los datos. Pulsa Calcular para ver el resultado de nuevo."
                    : "El resultado aparecerá aquí cuando pulses Calcular"}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

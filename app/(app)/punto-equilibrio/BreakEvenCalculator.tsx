"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Plus, X } from "lucide-react"
import Button from "@/components/ui/Button"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { CalcActionKey, CalcDevice, CalcDisplay } from "@/components/calculator"
import { parseEntry, sanitizeEntry, type EntryOptions } from "@/lib/calculator/entry"
import { formatCOP, formatNumber } from "@/lib/calculator/format"
import {
  BREAK_EVEN_RUBROS,
  contributionMarginOf,
  missingBreakEvenInputs,
  solveBreakEven,
  type BreakEvenOutcome,
} from "@/lib/calculator/breakEven"
import type { BreakEvenRecord } from "@/types/domain"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import styles from "./breakEven.module.css"

export interface BreakEvenSubmitData {
  fixedCosts: { name: string; amount: number }[]
  salePrice: number
  variableCost: number
}

/** Fila editable de la lista de costos fijos (el monto va como dígitos crudos). */
export type FixedRow = { id: number; name: string; amount: string }

// 9 dígitos = hasta "$ 999.999.999".
const MONEY: EntryOptions = { decimals: false, maxDigits: 9 }

const toRaw = (n: number | null | undefined) => (n != null && Number.isFinite(n) && n > 0 ? String(Math.round(n)) : "")

/** "$ 25.000" sin signo si está vacío; el campo muestra solo las cifras agrupadas. */
const groupDigits = (raw: string) => {
  const n = parseEntry(raw)
  return n == null ? "" : Math.round(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })
}

/** Total de los costos con monto: filas vacías o en 0 no cuentan. */
export function sumFixedRows(rows: FixedRow[]): number {
  return rows.reduce((s, r) => s + Math.max(0, parseEntry(r.amount) ?? 0), 0)
}

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

const signature = (rows: FixedRow[], price: string, variable: string) =>
  JSON.stringify(rows.map((r) => [r.name.trim(), parseEntry(r.amount) ?? 0]).filter(([n, a]) => n !== "" || a !== 0)) +
  "#" +
  (parseEntry(price) ?? "") +
  "|" +
  (parseEntry(variable) ?? "")

/** Campo de pesos con el aspecto de la pantalla de la calculadora. */
function MoneyField({
  id,
  label,
  value,
  onChange,
  inputRef,
  invalid,
  describedBy,
  hideLabel = false,
  placeholder = "0",
}: {
  id: string
  label: string
  value: string
  onChange: (raw: string) => void
  inputRef?: (el: HTMLInputElement | null) => void
  invalid?: boolean
  describedBy?: string
  hideLabel?: boolean
  placeholder?: string
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : styles.fieldLabel}>
        {label}
      </label>
      <div className={styles.lcd} data-invalid={invalid ? "true" : undefined}>
        <span className={styles.lcdUnit} aria-hidden>
          $
        </span>
        <input
          id={id}
          ref={inputRef}
          className={styles.lcdInput}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={groupDigits(value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onChange(sanitizeEntry(e.target.value, MONEY))}
        />
      </div>
    </div>
  )
}

/**
 * Pantalla única de "Nuevo cálculo": costos fijos, producto y resultado siempre
 * a la vista. El resultado se recalcula al escribir; solo se pide Guardar.
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
  const nextId = useRef(0)

  const [rows, setRows] = useState<FixedRow[]>(() =>
    (initialRecord?.fixedCosts ?? [])
      .filter((c) => c.amount > 0 && c.name.trim() !== "")
      .map((c) => ({ id: nextId.current++, name: c.name, amount: toRaw(c.amount) })),
  )
  const [price, setPrice] = useState(() => (fixedOnly ? "" : toRaw(initialRecord?.salePrice)))
  // El costo variable puede ser 0 (sin insumos): "0" es un dato válido, vacío no.
  const [variable, setVariable] = useState(() =>
    fixedOnly || !initialRecord ? "" : String(Math.max(0, Math.round(initialRecord.variableCost))),
  )
  const [note, setNote] = useState(prefillNote)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [baseline, setBaseline] = useState(() => signature(rows, price, variable))
  const [savedSig, setSavedSig] = useState<string | null>(null)
  const pendingFocus = useRef<{ id: number; field: "name" | "amount" } | null>(null)
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  const fixedTotal = sumFixedRows(rows)
  const salePrice = parseEntry(price)
  const variableCost = parseEntry(variable)
  const margin = contributionMarginOf(salePrice, variableCost)
  const live = solveLive(fixedTotal, salePrice, variableCost)
  const result = live.ok ? live.result : null

  // Todo costo con monto necesita nombre para quedar en el historial.
  const unnamed = rows.some((r) => (parseEntry(r.amount) ?? 0) > 0 && r.name.trim() === "")
  const sig = signature(rows, price, variable)
  const dirty = sig !== baseline
  const saved = result !== null && savedSig === sig
  const hasData = rows.length > 0 || price !== "" || variable !== ""
  const canSave = result !== null && !unnamed && !saved && !saving

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

  useEffect(() => {
    const p = pendingFocus.current
    if (!p) return
    pendingFocus.current = null
    inputRefs.current.get(`${p.id}-${p.field}`)?.focus()
  }, [rows])

  function addRow(name = "") {
    const id = nextId.current++
    pendingFocus.current = { id, field: name ? "amount" : "name" }
    setRows((prev) => [...prev, { id, name, amount: "" }])
  }
  const patchRow = (id: number, patch: Partial<FixedRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id))

  function reset() {
    setRows([])
    setPrice("")
    setVariable("")
    setNote(null)
    setSavedSig(null)
    setBaseline(signature([], "", ""))
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
    reset()
  }

  async function handleSave() {
    if (!result || !canSave || savingRef.current) return
    savingRef.current = true
    const savingSig = sig
    setSaving(true)
    try {
      await onSubmit({
        fixedCosts: rows
          .filter((r) => (parseEntry(r.amount) ?? 0) > 0)
          .map((r) => ({ name: r.name.trim(), amount: parseEntry(r.amount) as number })),
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

  // Rubros frecuentes del Excel que aún no están en la lista.
  const taken = new Set(rows.map((r) => r.name.trim().toLowerCase()))
  const suggestions = BREAK_EVEN_RUBROS.map((r) => r.name).filter((n) => !taken.has(n.toLowerCase()))

  const marginBad = margin !== null && margin <= 0
  const msgId = `${uid}-msg`
  const dash = (
    <span className={styles.dash} aria-hidden>
      —
    </span>
  )
  const tone = result ? "result" : live.ok === false && live.kind === "invalid" ? "error" : "idle"
  const stats: { label: string; value: React.ReactNode; spoken: string }[] = [
    {
      label: "UNIDADES AL MES",
      value: result ? formatNumber(result.unitsPerMonth, 2) : dash,
      spoken: result ? `${formatNumber(result.unitsPerMonth, 2)} unidades al mes` : "",
    },
    {
      label: "UNIDADES AL DÍA",
      value: result ? formatNumber(result.unitsPerDay, 2) : dash,
      spoken: result ? `${formatNumber(result.unitsPerDay, 2)} unidades al día` : "",
    },
    {
      label: "VENTAS DEL MES",
      value: result ? formatCOP(result.revenuePerMonth) : dash,
      spoken: result ? `${formatCOP(result.revenuePerMonth)} en ventas al mes` : "",
    },
    {
      label: "VENTAS DEL DÍA",
      value: result ? formatCOP(result.revenuePerDay) : dash,
      spoken: result ? `${formatCOP(result.revenuePerDay)} en ventas al día` : "",
    },
  ]

  const status = unnamed
    ? "Ponle nombre a cada costo para poder guardar."
    : saved
      ? "Cálculo guardado."
      : live.ok
        ? "Listo para guardar."
        : live.message

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {note && (
        <div
          className="flex flex-col gap-2 rounded-xl p-3 text-sm sm:flex-row sm:items-center"
          style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        >
          <p className="flex-1">{note}</p>
          <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
            Empezar en blanco
          </Button>
        </div>
      )}

      <CalcDevice label="Calculadora de punto de equilibrio" className={styles.device}>
        <div className={styles.grid}>
          {/* ── Costos fijos ── */}
          <section className={styles.panel} aria-labelledby={`${uid}-fixed`}>
            <div className={styles.panelHead}>
              <h2 id={`${uid}-fixed`} className={styles.panelTitle}>
                Costos fijos
              </h2>
              <p className={styles.panelHelp}>Lo que pagas al mes aunque no vendas</p>
            </div>

            {rows.length > 0 && (
              <ul className={styles.rows}>
                {rows.map((r) => (
                  <li key={r.id} className={styles.row}>
                    <div className={styles.rowName}>
                      <label htmlFor={`${uid}-n-${r.id}`} className="sr-only">
                        Nombre del costo
                      </label>
                      <input
                        id={`${uid}-n-${r.id}`}
                        ref={(el) => {
                          if (el) inputRefs.current.set(`${r.id}-name`, el)
                          else inputRefs.current.delete(`${r.id}-name`)
                        }}
                        className={styles.nameInput}
                        type="text"
                        autoComplete="off"
                        placeholder="Nombre (ej. Arriendo)"
                        value={r.name}
                        aria-invalid={(parseEntry(r.amount) ?? 0) > 0 && r.name.trim() === "" ? true : undefined}
                        onChange={(e) => patchRow(r.id, { name: e.target.value })}
                      />
                    </div>
                    <div className={styles.rowAmount}>
                      <MoneyField
                        id={`${uid}-a-${r.id}`}
                        label={`Monto de ${r.name.trim() || "este costo"} al mes`}
                        hideLabel
                        value={r.amount}
                        onChange={(raw) => patchRow(r.id, { amount: raw })}
                        inputRef={(el) => {
                          if (el) inputRefs.current.set(`${r.id}-amount`, el)
                          else inputRefs.current.delete(`${r.id}-amount`)
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => removeRow(r.id)}
                      aria-label={`Quitar ${r.name.trim() || "costo"}`}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.chips} role="group" aria-label="Agregar un costo frecuente">
              {suggestions.map((name) => (
                <button key={name} type="button" className={styles.chip} onClick={() => addRow(name)}>
                  {name}
                </button>
              ))}
              <button type="button" className={`${styles.chip} ${styles.chipOther}`} onClick={() => addRow()}>
                <Plus size={13} aria-hidden />
                Otro costo
              </button>
            </div>

            <div className={styles.totalRow}>
              <span>Total al mes</span>
              <strong className={styles.totalValue}>{formatCOP(fixedTotal)}</strong>
            </div>
          </section>

          {/* ── Tu producto ── */}
          <section className={styles.panel} aria-labelledby={`${uid}-prod`}>
            <div className={styles.panelHead}>
              <h2 id={`${uid}-prod`} className={styles.panelTitle}>
                Tu producto
              </h2>
              <p className={styles.panelHelp}>Por cada unidad que vendes</p>
            </div>
            <MoneyField
              id={`${uid}-price`}
              label="Precio de venta"
              value={price}
              onChange={setPrice}
              invalid={marginBad}
              describedBy={marginBad ? msgId : undefined}
              placeholder="0"
            />
            <MoneyField
              id={`${uid}-variable`}
              label="Costo variable por unidad"
              value={variable}
              onChange={setVariable}
              invalid={marginBad}
              describedBy={marginBad ? msgId : undefined}
              placeholder="0 si no tiene insumos"
            />
            <div className={styles.totalRow}>
              <span>Margen por unidad</span>
              <strong className={marginBad ? styles.totalBad : styles.totalValue}>
                {margin !== null ? formatCOP(margin) : "—"}
              </strong>
            </div>
          </section>

          {/* ── Resultado en vivo ── */}
          <section className={`${styles.panel} ${styles.resultPanel}`} aria-labelledby={`${uid}-res`}>
            <div className={styles.panelHead}>
              <h2 id={`${uid}-res`} className={styles.panelTitle}>
                Resultado en vivo
              </h2>
              <p className={styles.panelHelp}>Lo que debes vender para cubrir tus costos</p>
            </div>
            <div className={styles.stats}>
              {stats.map((s) => (
                <CalcDisplay
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  tone={tone}
                  size="sm"
                  announce={s.spoken}
                  revealKey={result ? result.unitsPerMonth : undefined}
                />
              ))}
            </div>
            <p
              id={msgId}
              className={styles.status}
              data-tone={marginBad || (live.ok === false && live.kind === "invalid") || unnamed ? "error" : undefined}
              role={marginBad || unnamed ? "alert" : "status"}
            >
              {status}
            </p>
          </section>
        </div>

        <div className={styles.actions}>
          <CalcActionKey variant="fn" onClick={handleClear} disabled={saving} slotClassName={styles.actionSlot}>
            Limpiar
          </CalcActionKey>
          {saved ? (
            <CalcActionKey onClick={onDone} slotClassName={styles.actionSlotMain}>
              Ver historial
            </CalcActionKey>
          ) : (
            <CalcActionKey
              onClick={handleSave}
              disabled={!canSave}
              aria-busy={saving || undefined}
              slotClassName={styles.actionSlotMain}
            >
              {saving ? "Guardando…" : "Guardar"}
            </CalcActionKey>
          )}
        </div>
      </CalcDevice>
    </div>
  )
}

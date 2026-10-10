"use client"

import { useEffect, useRef } from "react"
import { entryKeyFromKeyboard, type EntryKey, type EntryOptions } from "@/lib/calculator/entry"
import CalcActionKey from "./CalcActionKey"
import CalcDevice from "./CalcDevice"
import CalcDisplay, { type CalcDisplayTone } from "./CalcDisplay"
import CalcKeypad from "./CalcKeypad"
import CalcRegister from "./CalcRegister"

export interface CalcPanelField<F extends string> {
  key: F
  /** Etiqueta corta de la pantalla LCD */
  label: string
  ariaLabel: string
  /** Valor crudo → texto para mostrar ("$ 25.000", "35 %") */
  format: (raw: string) => string
  placeholder: string
  /** "inline" = fila compacta (datos secundarios como márgenes o bajas) */
  variant?: "block" | "inline"
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

/**
 * Calculadora genérica "datos → resultado": pantalla, registros, teclado y
 * botón Calcular. Los módulos solo le pasan sus campos y el texto de la
 * pantalla; las fórmulas viven en cada módulo (ver useSolverCalculator).
 *
 * El teclado físico escribe en el dato activo sin hacer clic antes, salvo que
 * el foco esté en otro control de texto o haya un diálogo abierto que NO
 * contenga a la calculadora (así también funciona dentro de un modal).
 */
export default function CalcPanel<F extends string>({
  label,
  display,
  fields,
  values,
  entry,
  active,
  fresh,
  errorField,
  onActivate,
  onKey,
  onRawInput,
  onCalculate,
  onClearAll,
  children,
  footer,
  title,
}: {
  /** Nombre accesible del aparato */
  label: string
  display: {
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    tone: CalcDisplayTone
    announce?: string
    revealKey?: string | number
  }
  fields: CalcPanelField<F>[]
  values: Record<F, string>
  entry: Record<F, EntryOptions>
  active: F
  fresh: boolean
  /** Registro que el último cálculo señaló como incorrecto */
  errorField?: F | null
  onActivate: (field: F) => void
  onKey: (key: EntryKey) => void
  onRawInput: (field: F, raw: string) => void
  onCalculate: () => void
  onClearAll: () => void
  /** Contenido extra entre los registros y el teclado */
  children?: React.ReactNode
  /** Contenido bajo el botón Calcular (ej. "Usar en el formulario") */
  footer?: React.ReactNode
  /** Línea impresa bajo la marca del aparato (ej. "Punto de equilibrio") */
  title?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const registerRefs = useRef<Partial<Record<F, HTMLInputElement | null>>>({})
  const live = useRef({ active, onKey, onCalculate })
  useEffect(() => {
    live.current = { active, onKey, onCalculate }
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      if (isTypingTarget(e.target)) return
      if (document.querySelector('[role="listbox"]')) return
      const dialog = document.querySelector('[aria-modal="true"]')
      if (dialog && !dialog.contains(wrapRef.current)) return
      const c = live.current
      if (e.key === "Enter" && !(e.target as HTMLElement | null)?.closest?.("a,button,summary,[role]")) {
        e.preventDefault()
        c.onCalculate()
        return
      }
      const key = entryKeyFromKeyboard(e.key)
      if (!key) return
      e.preventDefault()
      registerRefs.current[c.active]?.focus({ preventScroll: true })
      c.onKey(key)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const errorId = `${label.replace(/\s+/g, "-").toLowerCase()}-message`

  function renderField(f: CalcPanelField<F>) {
    const hasError = errorField === f.key
    return (
      <CalcRegister
        key={f.key}
        ref={(el) => {
          registerRefs.current[f.key] = el
        }}
        id={`${errorId}-${f.key}`}
        label={f.label}
        ariaLabel={f.ariaLabel}
        display={f.format(values[f.key])}
        placeholder={f.placeholder}
        active={active === f.key}
        fresh={fresh}
        error={hasError}
        describedBy={hasError ? errorId : undefined}
        variant={f.variant ?? "block"}
        onActivate={() => onActivate(f.key)}
        onKey={onKey}
        onRawInput={(raw) => onRawInput(f.key, raw)}
        onEnter={onCalculate}
      />
    )
  }

  const blocks = fields.filter((f) => (f.variant ?? "block") === "block")
  const inlines = fields.filter((f) => f.variant === "inline")

  return (
    <div ref={wrapRef}>
      <CalcDevice label={label} model={title}>
        <CalcDisplay
          label={display.label}
          value={display.value}
          sub={display.sub}
          subId={errorId}
          tone={display.tone}
          announce={display.announce}
          revealKey={display.revealKey}
        />

        <div className="calc-registers">{blocks.map(renderField)}</div>
        {inlines.map(renderField)}
        {children}

        <div className="calc-keypad-slot">
          <CalcKeypad onKey={onKey} onClearAll={onClearAll} decimalEnabled={entry[active].decimals} />
        </div>

        <CalcActionKey onClick={onCalculate}>Calcular</CalcActionKey>
        {footer}
      </CalcDevice>
    </div>
  )
}

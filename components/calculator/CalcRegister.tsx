"use client"

import { forwardRef } from "react"
import { entryKeyFromKeyboard, type EntryKey } from "@/lib/calculator/entry"
import "./calculator.css"

export interface CalcRegisterProps {
  id: string
  /** Etiqueta corta del campo */
  label: string
  /** Nombre completo para lectores de pantalla */
  ariaLabel: string
  /** Valor ya formateado para mostrar ("$ 25.000", "35 %") */
  display: string
  placeholder?: string
  /**
   * Teclado del sistema en móvil: "numeric" para montos enteros,
   * "decimal" para porcentajes, "none" cuando el teclado de la calculadora
   * propio está en pantalla. En desktop no cambia nada (no hay teclado OS).
   */
  inputMode?: "none" | "numeric" | "decimal"
  active: boolean
  /** Recién seleccionado con un valor previo: la primera tecla lo reemplaza */
  fresh?: boolean
  error?: boolean
  describedBy?: string
  variant?: "block" | "inline"
  /** Acción secundaria en la cabecera del registro (ej. cargar desde receta) */
  accessory?: React.ReactNode
  /** Línea bajo el valor (ej. de dónde viene el dato) */
  note?: React.ReactNode
  onActivate: () => void
  onKey: (key: EntryKey) => void
  /** Texto pegado / autocompletado, sin sanear */
  onRawInput: (raw: string) => void
  onEnter?: () => void
}

/**
 * Campo de entrada numérico. Es un <input> real (foco, teclado del sistema,
 * lectores de pantalla): en móvil se le pasa `inputMode="numeric"|"decimal"`
 * para que abra el teclado nativo; el teclado propio de la calculadora solo
 * se muestra en desktop.
 *
 * El valor se guarda crudo y el formato es solo de presentación — el
 * teclado físico no edita el texto formateado, pasa por la misma lógica que
 * el teclado en pantalla (applyEntryKey).
 */
const CalcRegister = forwardRef<HTMLInputElement, CalcRegisterProps>(function CalcRegister(
  {
    id,
    label,
    ariaLabel,
    display,
    placeholder = "0",
    inputMode = "none",
    active,
    fresh,
    error,
    describedBy,
    variant = "block",
    accessory,
    note,
    onActivate,
    onKey,
    onRawInput,
    onEnter,
  },
  ref,
) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === "Enter") {
      e.preventDefault()
      onEnter?.()
      return
    }
    const key = entryKeyFromKeyboard(e.key)
    if (key) {
      e.preventDefault()
      onKey(key)
      return
    }
    // Cualquier otro carácter imprimible se ignora; Tab, flechas, etc. siguen su curso.
    if (e.key.length === 1) e.preventDefault()
  }

  const classes = [
    "calc-register",
    active ? "is-on" : "is-off",
    active && fresh && display ? "is-fresh" : "",
    error ? "is-error" : "",
    variant === "inline" ? "is-inline" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      className={classes}
      onClick={(e) => {
        // Activar explícitamente (no depender solo del evento focus: si el
        // input ya tenía el foco, o la ventana no lo tiene, focus no se dispara).
        onActivate()
        const input = (e.currentTarget as HTMLElement).querySelector("input")
        if (document.activeElement !== input) input?.focus({ preventScroll: true })
      }}
    >
      <div className="calc-register-head">
        <label className="calc-register-label" htmlFor={id}>
          {label}
        </label>
        {accessory}
      </div>
      <input
        ref={ref}
        id={id}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        placeholder={placeholder}
        value={display}
        onFocus={onActivate}
        onKeyDown={handleKeyDown}
        onChange={(e) => onRawInput(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          onRawInput(e.clipboardData.getData("text"))
        }}
      />
      {note && <div className="calc-register-note">{note}</div>}
    </div>
  )
})

export default CalcRegister

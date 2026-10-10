"use client"

import { useRef } from "react"
import "./calculator.css"
import { MODE_META, MODE_ORDER, type CalculatorMode } from "./lib"

/**
 * Selector de qué calcular: tres opciones, siempre visibles, en el orden en
 * que un cálculo alimenta al siguiente. Reemplaza la pantalla intermedia de
 * "elige una función" + botón atrás. Mismo lenguaje de tecla física que el
 * resto del aparato (antes era un segmented control plano).
 */
export default function ModeSwitcher({
  mode,
  onChange,
  panelId,
}: {
  mode: CalculatorMode
  onChange: (m: CalculatorMode) => void
  panelId?: string
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = (index + delta + MODE_ORDER.length) % MODE_ORDER.length
    onChange(MODE_ORDER[next])
    tabRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Qué quieres calcular"
      className="calc-mode-switch"
    >
      {MODE_ORDER.map((m, i) => {
        const selected = m === mode
        return (
          <button
            key={m}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(m)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={selected ? "calc-key-mode calc-key-mode-active" : "calc-key-mode"}
          >
            {MODE_META[m].title}
          </button>
        )
      })}
    </div>
  )
}

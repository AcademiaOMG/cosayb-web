"use client"

import { useEffect, useRef } from "react"
import { Delete } from "lucide-react"
import type { EntryKey } from "@/lib/calculator/entry"
import { playKeyDown, playKeyUp } from "@/lib/calculator/sound"
import { keySoundProps } from "./useKeySound"
import "./calculator.css"

/** Tecla física → data-k de la tecla en pantalla que se hunde mientras se pulsa. */
function keyboardToKey(key: string): string | null {
  if (/^[0-9]$/.test(key)) return key
  if (key === "," || key === ".") return "decimal"
  if (key === "Backspace") return "backspace"
  if (key === "Delete" || key === "Escape") return "clear"
  return null
}

function isOutsideTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  return typing && !target.closest(".calc-device")
}

/**
 * Teclado numérico. Escribe sobre el dato activo sin robarle el foco
 * (preventDefault en mousedown), así el teclado físico y el de pantalla se
 * pueden alternar sin volver a seleccionar el campo. La tecla en pantalla se
 * hunde (y suena) mientras se pulsa la del teclado físico.
 *
 * Teclas de función con nombre en palabras ("Limpiar"), no siglas de
 * calculadora (C / AC). Incluye "000" porque en pesos casi todo precio
 * termina en miles.
 */
export default function CalcKeypad({
  onKey,
  onClearAll,
  decimalEnabled,
}: {
  onKey: (key: EntryKey) => void
  onClearAll: () => void
  /** El dato activo acepta decimales (ej. porcentajes) */
  decimalEnabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const held = useRef(new Set<string>())

  useEffect(() => {
    const pad = ref.current
    if (!pad) return
    function down(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      if (isOutsideTyping(e.target)) return
      const k = keyboardToKey(e.key)
      if (!k) return
      const btn = pad!.querySelector<HTMLButtonElement>(`[data-k="${k}"]`)
      if (!btn || btn.disabled) return
      btn.classList.add("down")
      held.current.add(e.key)
      playKeyDown()
    }
    function up(e: KeyboardEvent) {
      const k = keyboardToKey(e.key)
      if (!k || !held.current.delete(e.key)) return
      pad!.querySelector(`[data-k="${k}"]`)?.classList.remove("down")
      playKeyUp()
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  const keep = (e: React.MouseEvent) => e.preventDefault()

  const num = (d: string, span2 = false) => (
    <div className={`calc-slot${span2 ? " calc-key-span-2" : ""}`}>
      <button
        type="button"
        data-k={d}
        className={`calc-key calc-key-num${span2 ? " calc-key-span-2" : ""}`}
        onMouseDown={keep}
        onClick={() => onKey({ type: "digit", digit: d })}
        {...keySoundProps}
      >
        {d}
      </button>
    </div>
  )

  const fn = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { k: string; word?: boolean }) => {
    const { k, word, className, ...rest } = props
    return (
      <div className="calc-slot">
        <button
          type="button"
          data-k={k}
          aria-disabled={rest.disabled || undefined}
          className={`calc-key calc-key-fn${word ? " calc-key-word" : ""}${className ? ` ${className}` : ""}`}
          onMouseDown={keep}
          {...keySoundProps}
          {...rest}
        />
      </div>
    )
  }

  return (
    <div ref={ref} className="calc-keypad" role="group" aria-label="Teclado numérico">
      {num("7")}
      {num("8")}
      {num("9")}
      {fn({
        k: "backspace",
        onClick: () => onKey({ type: "backspace" }),
        "aria-label": "Borrar un número",
        title: "Borrar un número",
        children: <Delete size={18} aria-hidden />,
      })}

      {num("4")}
      {num("5")}
      {num("6")}
      {fn({ k: "clear", word: true, onClick: onClearAll, title: "Borrar todos los datos", children: "Limpiar" })}

      {num("1")}
      {num("2")}
      {num("3")}
      {fn({
        k: "decimal",
        onClick: () => onKey({ type: "decimal" }),
        disabled: !decimalEnabled,
        "aria-label": "Coma decimal",
        title: decimalEnabled ? "Coma decimal" : "Los precios en pesos no llevan decimales",
        children: ",",
      })}

      {num("0", true)}
      {num("000", true)}
    </div>
  )
}

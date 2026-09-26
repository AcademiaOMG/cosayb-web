"use client"

import { Delete } from "lucide-react"
import type { EntryKey } from "@/lib/calculator/entry"
import "./calculator.css"

/**
 * Teclado numérico. Escribe sobre el dato activo sin robarle el foco
 * (preventDefault en mousedown), así el teclado físico y el de pantalla se
 * pueden alternar sin volver a seleccionar el campo.
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
  const keep = (e: React.MouseEvent) => e.preventDefault()

  const num = (d: string, extra = "") => (
    <button
      type="button"
      className={`calc-key calc-key-num ${extra}`}
      onMouseDown={keep}
      onClick={() => onKey({ type: "digit", digit: d })}
    >
      {d}
    </button>
  )

  return (
    <div className="calc-keypad" role="group" aria-label="Teclado numérico">
      {num("7")}
      {num("8")}
      {num("9")}
      <button
        type="button"
        className="calc-key calc-key-fn"
        onMouseDown={keep}
        onClick={() => onKey({ type: "backspace" })}
        aria-label="Borrar un número"
        title="Borrar un número"
      >
        <Delete size={18} />
      </button>

      {num("4")}
      {num("5")}
      {num("6")}
      <button
        type="button"
        className="calc-key calc-key-fn calc-key-word"
        onMouseDown={keep}
        onClick={onClearAll}
        title="Borrar todos los datos"
      >
        Limpiar
      </button>

      {num("1")}
      {num("2")}
      {num("3")}
      <button
        type="button"
        className="calc-key calc-key-fn"
        onMouseDown={keep}
        onClick={() => decimalEnabled && onKey({ type: "decimal" })}
        aria-disabled={!decimalEnabled}
        aria-label="Coma decimal"
        title={decimalEnabled ? "Coma decimal" : "Los precios en pesos no llevan decimales"}
      >
        ,
      </button>

      {num("0", "calc-key-span-2")}
      {num("000", "calc-key-span-2")}
    </div>
  )
}

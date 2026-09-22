"use client"

import { Delete } from "lucide-react"

/** Teclado numérico físico: escribe sobre el campo actualmente activo de la pantalla. */
export default function CalcKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  onClear,
}: {
  onDigit: (d: string) => void
  onDecimal: () => void
  onBackspace: () => void
  onClear: () => void
}) {
  return (
    <div className="calc-keypad">
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("7")}>7</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("8")}>8</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("9")}>9</button>
      <button type="button" className="calc-key calc-key-fn" onClick={onBackspace} aria-label="Borrar">
        <Delete size={16} style={{ margin: "0 auto" }} />
      </button>

      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("4")}>4</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("5")}>5</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("6")}>6</button>
      <button type="button" className="calc-key calc-key-fn" onClick={onClear}>C</button>

      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("1")}>1</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("2")}>2</button>
      <button type="button" className="calc-key calc-key-num" onClick={() => onDigit("3")}>3</button>
      <button type="button" className="calc-key calc-key-fn" onClick={onDecimal}>.</button>

      <button type="button" className="calc-key calc-key-num calc-key-zero" onClick={() => onDigit("0")}>0</button>
    </div>
  )
}

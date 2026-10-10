"use client"

import { setCalcSkin, useCalcSkin, type CalcSkin } from "@/lib/calculator/skin"
import "./calculator.css"

const OPTIONS: { value: CalcSkin; label: string }[] = [
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
]

/**
 * Cambia el diseño de todas las calculadoras entre el verde (producción) y el
 * azul (nuevo). Es temporal: sirve para mostrarle las dos opciones al cliente
 * y quedarse con una.
 */
export default function CalcSkinSwitch() {
  const skin = useCalcSkin()
  return (
    <div className="calc-skin-switch" role="group" aria-label="Diseño de la calculadora">
      <span className="calc-skin-switch-label">Diseño</span>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={skin === o.value}
          className="calc-skin-switch-opt"
          onClick={() => setCalcSkin(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

"use client"

import { useSyncExternalStore } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { getSoundOn, setSoundOn, subscribeSound } from "@/lib/calculator/sound"
import "./calculator.css"

/**
 * Carcasa de la calculadora física: marca ficticia, celda solar e
 * interruptor de sonido arriba; el contenido (LCD, datos, teclado) lo decide
 * cada uso. Ver .claude/calculadora-fisica_skill.
 */
export default function CalcDevice({
  children,
  label,
  className,
  brand = "COSAYB",
  model = "Calculadora",
}: {
  children: React.ReactNode
  /** Nombre accesible del aparato (ej. "Calculadora de precio de venta") */
  label: string
  className?: string
  /** Marca ficticia grabada en la carcasa */
  brand?: string
  /** Línea impresa bajo la marca */
  model?: string
}) {
  const soundOn = useSyncExternalStore(subscribeSound, getSoundOn, () => true)

  return (
    <section className={`calc-device${className ? ` ${className}` : ""}`} aria-label={label}>
      <div className="calc-top">
        <div className="calc-brand">
          <b>{brand}</b>
          <span className="calc-print">{model}</span>
        </div>
        <div className="calc-top-right">
          <button
            type="button"
            className="calc-sound"
            aria-pressed={soundOn}
            aria-label={soundOn ? "Sonido activado" : "Sonido apagado"}
            title={soundOn ? "Sonido activado" : "Sonido apagado"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}
          </button>
          <div className="calc-solar" aria-hidden />
        </div>
      </div>
      {children}
    </section>
  )
}

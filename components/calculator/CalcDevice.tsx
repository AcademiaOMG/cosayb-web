"use client"

import { useSyncExternalStore } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { useCalcSkin } from "@/lib/calculator/skin"
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
  hint,
}: {
  children: React.ReactNode
  /** Nombre accesible del aparato (ej. "Calculadora de precio de venta") */
  label: string
  className?: string
  /** Marca ficticia grabada en la carcasa */
  brand?: string
  /** Línea impresa bajo la marca */
  model?: string
  /** Piel verde: pista corta a la derecha del encabezado (si se pasa, se muestra el encabezado) */
  hint?: string
}) {
  const blue = useCalcSkin() === "blue"
  const soundOn = useSyncExternalStore(subscribeSound, getSoundOn, () => true)

  return (
    <>
      <section className={`calc-device calc-skin-${blue ? "blue" : "green"}${className ? ` ${className}` : ""}`} aria-label={label}>
        {blue && (
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
        )}
        {!blue && hint !== undefined && (
          <div className="calc-head" aria-hidden>
            <span className="calc-head-led" />
            <span className="calc-head-title">{model}</span>
            {hint && <span className="calc-head-hint">{hint}</span>}
          </div>
        )}
        {children}
      </section>
    </>
  )
}

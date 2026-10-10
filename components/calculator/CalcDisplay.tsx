import { useCalcSkin } from "@/lib/calculator/skin"
import SegText, { splitUnit } from "./SegText"
import "./calculator.css"

export type CalcDisplayTone = "idle" | "error" | "result"

/**
 * Pantalla LCD principal: una etiqueta pequeña y el resultado en dígitos de
 * 7 segmentos. No muestra mensajes ni fórmulas — `sub` y `announce` van a una
 * región aria-live oculta para lectores de pantalla.
 */
export default function CalcDisplay({
  label,
  value,
  sub,
  tone,
  size = "md",
  announce,
  subId,
  revealKey,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone: CalcDisplayTone
  size?: "md" | "sm"
  /** Texto final para lectores de pantalla (el valor visible puede estar animándose) */
  announce?: string
  subId?: string
  /** Cambiarlo reinicia el parpadeo de revelado */
  revealKey?: string | number
}) {
  const blue = useCalcSkin() === "blue"
  const skinClass = blue ? "calc-skin-blue" : "calc-skin-green"
  const isText = typeof value === "string" || typeof value === "number"
  const parts = isText ? splitUnit(String(value)) : null
  const unit = parts?.unit ? <span className="calc-unit">{parts.unit}</span> : null

  if (!blue) {
    // Piel verde (producción): pantalla con el número en texto y la línea de qué falta
    return (
      <div className={`calc-display ${skinClass} is-${tone}${size === "sm" ? " is-sm" : ""}`}>
        <span className="calc-display-label">{label}</span>
        <span key={revealKey} className="calc-display-value" aria-hidden={announce ? true : undefined}>
          {value}
        </span>
        {sub !== undefined && (
          <span className="calc-display-sub" id={subId} role={tone === "error" ? "alert" : undefined}>
            {sub}
          </span>
        )}
        {announce !== undefined && (
          <span className="sr-only" aria-live="polite">
            {announce}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`calc-display ${skinClass} is-${tone}${size === "sm" ? " is-sm" : ""}`}>
      <div className="calc-bezel">
        <div className="calc-glass">
          <div className="calc-ann">
            <span className="calc-display-label">{label}</span>
          </div>
          <div key={revealKey} className="calc-mainrow calc-display-value" aria-hidden>
            {parts ? (
              <>
                {parts.unitSide === "left" && unit}
                <SegText number={parts.number} cells={8} dim={tone !== "result"} className="calc-main" />
                {parts.unitSide === "right" && unit}
              </>
            ) : (
              value
            )}
          </div>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      {sub !== undefined && sub !== "" && (
        <span className="sr-only" id={subId} role={tone === "error" ? "alert" : undefined}>
          {sub}
        </span>
      )}
    </div>
  )
}

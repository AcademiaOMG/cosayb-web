"use client"

import "./calculator.css"

/**
 * Carcasa de la calculadora física: marca ficticia y celda solar
 * arriba; el contenido (LCD, datos, teclado) lo decide
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
  return (
    <>
      <section className={`calc-device calc-skin-blue${className ? ` ${className}` : ""}`} aria-label={label}>
        <div className="calc-top">
          <div className="calc-brand">
            <b>{brand}</b>
            <span className="calc-print">{model}</span>
          </div>
          <div className="calc-top-right">
            <div className="calc-solar" aria-hidden />
          </div>
        </div>
        {children}
      </section>
    </>
  )
}

import "./calculator.css"

/** Cuerpo de la calculadora física. Solo compone — el contenido lo decide cada uso. */
export default function CalcDevice({
  children,
  label,
  className,
}: {
  children: React.ReactNode
  /** Nombre accesible del aparato (ej. "Calculadora de precio de venta") */
  label: string
  className?: string
}) {
  return (
    <section className={`calc-device${className ? ` ${className}` : ""}`} aria-label={label}>
      {children}
    </section>
  )
}

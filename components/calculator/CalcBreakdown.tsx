import "./calculator.css"

/** Desglose bajo la calculadora: filas "dato → valor" (ver .calc-breakdown). */
export default function CalcBreakdown({
  rows,
  title = "Desglose",
}: {
  rows: { label: string; value: string; strong?: boolean }[]
  title?: string
}) {
  return (
    <section className="calc-breakdown" aria-label={title}>
      <h3 className="calc-breakdown-title">{title}</h3>
      <dl className="m-0 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className={`calc-breakdown-row${r.strong ? " is-strong" : ""}`}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

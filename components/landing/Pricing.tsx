import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "Gratis",
    description: "Para explorar y aprender",
    features: [
      "Hasta 30 ingredientes",
      "5 recetas",
      "1 menú",
      "Soporte por email",
    ],
    cta: "Empieza gratis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$ 49.900",
    period: "/ mes",
    description: "Para negocios que quieren crecer",
    features: [
      "Ingredientes ilimitados",
      "Recetas ilimitadas",
      "Menús ilimitados",
      "Valoración A&B",
      "Punto de Equilibrio",
      "Soporte prioritario",
    ],
    cta: "Comenzar 14 días gratis",
    highlighted: true,
  },
]

export default function Pricing() {
  return (
    <section
      id="precios"
      className="px-6 py-20"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className="font-display text-4xl font-bold text-center mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Precios simples y transparentes
        </h2>
        <p
          className="text-center text-base mb-14"
          style={{ color: "var(--text-secondary)" }}
        >
          Sin contratos. Cancela cuando quieras.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map(({ name, price, period, description, features, cta, highlighted }) => (
            <div
              key={name}
              className="flex flex-col gap-6 rounded-2xl p-7"
              style={{
                background: highlighted ? "var(--bg-inverse)" : "var(--bg-surface)",
                border: highlighted
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border-light)",
              }}
            >
              <div className="flex flex-col gap-1">
                <span
                  className="font-display text-2xl font-bold"
                  style={{ color: highlighted ? "#fff" : "var(--text-primary)" }}
                >
                  {name}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-display text-4xl font-bold"
                    style={{ color: highlighted ? "#fff" : "var(--text-primary)" }}
                  >
                    {price}
                  </span>
                  {period && (
                    <span
                      className="text-sm"
                      style={{ color: highlighted ? "#8FA0BC" : "var(--text-muted)" }}
                    >
                      {period}
                    </span>
                  )}
                </div>
                <p
                  className="text-sm"
                  style={{ color: highlighted ? "#8FA0BC" : "var(--text-muted)" }}
                >
                  {description}
                </p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: highlighted ? "#C8D5E8" : "var(--text-secondary)" }}
                  >
                    <span style={{ color: highlighted ? "var(--accent)" : "var(--accent)" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="h-11 px-4 rounded-xl text-sm font-semibold flex items-center justify-center"
                style={
                  highlighted
                    ? { background: "var(--accent)", color: "#fff" }
                    : {
                        border: "1px solid var(--border-light)",
                        color: "var(--text-primary)",
                      }
                }
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const problems = [
  {
    emoji: "📊",
    title: "Hojas de cálculo que se rompen",
    description:
      "Cada receta en un Excel diferente, precios desactualizados y fórmulas que se dañan con cada cambio de precio.",
  },
  {
    emoji: "💸",
    title: "Costos ocultos en cada plato",
    description:
      "Sin factores de rendimiento ni mermas, el costo real puede ser hasta un 30% más alto de lo que crees.",
  },
  {
    emoji: "❓",
    title: "No sabes cuánto necesitas vender",
    description:
      "Sin calcular tu punto de equilibrio, no sabes si tu negocio es rentable o solo te está haciendo trabajar gratis.",
  },
]

export default function Problema() {
  return (
    <section
      className="px-6 py-20"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display text-4xl font-bold text-center mb-12"
          style={{ color: "var(--text-primary)" }}
        >
          ¿Te suena familiar?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map(({ emoji, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-xl p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
              }}
            >
              <span className="text-3xl">{emoji}</span>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

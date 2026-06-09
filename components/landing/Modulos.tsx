const modules = [
  {
    icon: "📦",
    title: "Inventario",
    description: "Gestiona ingredientes con precio, unidad y proveedor.",
  },
  {
    icon: "⚖️",
    title: "Factor de Rendimiento",
    description: "Registra mermas y obtén el costo real post-procesamiento.",
  },
  {
    icon: "👨‍🍳",
    title: "Recetas",
    description: "Fichas técnicas con costo automático por porción.",
  },
  {
    icon: "🍽️",
    title: "Menú",
    description: "Carta con análisis de rentabilidad por plato.",
  },
  {
    icon: "📈",
    title: "Valoración A&B",
    description: "Análisis de ingresos, costos y utilidad por período.",
  },
  {
    icon: "📉",
    title: "Punto de Equilibrio",
    description: "Cuánto necesitas vender para no perder dinero.",
  },
]

export default function Modulos() {
  return (
    <section
      id="módulos"
      className="px-6 py-20"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display text-4xl font-bold text-center mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Todo lo que necesita tu cocina
        </h2>
        <p
          className="text-center text-base mb-14 max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Seis módulos integrados. Un solo software. Sin hojas de cálculo.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-xl p-5"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
              }}
            >
              <span className="text-2xl">{icon}</span>
              <h3
                className="font-display text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

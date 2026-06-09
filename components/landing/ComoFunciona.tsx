const steps = [
  {
    number: "01",
    title: "Ingresa tus ingredientes",
    description:
      "Registra ingredientes con su precio de compra o importa el banco base de CO$AYB con más de 200 insumos comunes.",
  },
  {
    number: "02",
    title: "Crea tus recetas",
    description:
      "Construye fichas técnicas con cantidades, mermas y rendimientos reales. El costo por porción se calcula automáticamente.",
  },
  {
    number: "03",
    title: "Arma tu carta",
    description:
      "Organiza las recetas en tu menú con precio de venta y visualiza al instante el porcentaje de costo de cada plato.",
  },
  {
    number: "04",
    title: "Toma decisiones con datos",
    description:
      "Conoce tu punto de equilibrio, analiza la valoración A&B de tu negocio y ajusta precios con seguridad.",
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display text-4xl font-bold text-center mb-16"
          style={{ color: "var(--text-primary)" }}
        >
          Cómo funciona CO$AYB
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="flex gap-5">
              <span
                className="font-display text-4xl font-bold shrink-0 leading-none"
                style={{ color: "var(--border-medium)" }}
              >
                {number}
              </span>
              <div className="flex flex-col gap-2">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

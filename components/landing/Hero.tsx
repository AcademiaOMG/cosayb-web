import Link from "next/link"

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-6"
        style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
      >
        Software de costos gastronómicos
      </span>
      <h1
        className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Sabe exactamente cuánto <span style={{ color: "var(--accent)" }}>cuesta</span> cada plato
      </h1>
      <p
        className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        CO$AYB es el software que necesita tu cocina para controlar costos, calcular recetas y
        conocer tu punto de equilibrio — sin hojas de cálculo.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/login"
          className="h-12 px-8 rounded-xl text-base font-semibold flex items-center"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Empieza gratis
        </Link>
        <Link
          href="#como-funciona"
          className="h-12 px-8 rounded-xl text-base font-semibold flex items-center"
          style={{
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        >
          Ver cómo funciona
        </Link>
      </div>
    </section>
  )
}

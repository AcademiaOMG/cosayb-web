const testimonios = [
  {
    nombre: "Laura Martínez",
    rol: "Chef propietaria, Restaurante Origen",
    texto:
      "Antes perdía plata sin saber por qué. Con CO$AYB descubrí que mi plato estrella tenía un costo del 48%. Lo ajusté y ahora mi margen es del 35%.",
  },
  {
    nombre: "Carlos Pérez",
    rol: "Administrador, Cafetería Nómada",
    texto:
      "Lo que antes me tomaba un día en Excel, ahora lo hago en 20 minutos. El banco de ingredientes es un salvazo.",
  },
  {
    nombre: "Ana González",
    rol: "Docente de gastronomía",
    texto:
      "Lo uso con mis estudiantes. Es la herramienta más clara que he encontrado para enseñar costos gastronómicos a nivel profesional.",
  },
]

export default function Testimonios() {
  return (
    <section id="testimonios" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display text-4xl font-bold text-center mb-14"
          style={{ color: "var(--text-primary)" }}
        >
          Lo que dicen nuestros usuarios
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonios.map(({ nombre, rol, texto }) => (
            <figure
              key={nombre}
              className="flex flex-col gap-4 rounded-xl p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
              }}
            >
              <blockquote>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  &ldquo;{texto}&rdquo;
                </p>
              </blockquote>
              <figcaption className="flex flex-col gap-0.5 mt-auto">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {nombre}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {rol}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

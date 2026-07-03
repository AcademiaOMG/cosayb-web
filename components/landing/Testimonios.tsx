const testimonios = [
  {
    nombre: "Laura Martínez",
    rol: "Chef propietaria",
    empresa: "Restaurante Origen",
    texto:
      "Antes perdía plata sin saber por qué. Con CO$AYB descubrí que mi plato estrella tenía un costo del 48%. Lo ajusté y ahora mi margen es del 35%.",
    stars: 5,
    avatar: "LM",
    avatarBg: "#1B4FD8",
  },
  {
    nombre: "Carlos Pérez",
    rol: "Administrador",
    empresa: "Cafetería Nómada",
    texto:
      "Lo que antes me tomaba un día en Excel, ahora lo hago en 20 minutos. El banco de ingredientes colombianos es un salvazo.",
    stars: 5,
    avatar: "CP",
    avatarBg: "#0D7B52",
  },
  {
    nombre: "Ana González",
    rol: "Docente de gastronomía",
    empresa: "Escuela OMG",
    texto:
      "Lo uso con mis estudiantes. Es la herramienta más clara que he encontrado para enseñar costos gastronómicos a nivel profesional.",
    stars: 5,
    avatar: "AG",
    avatarBg: "#7C3AED",
  },
]

export default function Testimonios() {
  return (
    <section
      id="testimonios"
      className="py-14 sm:py-20 px-6 sm:px-10 lg:px-16"
      style={{ background: "#F5F0E8" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
            Testimonios
          </span>
          <h2
            className="font-display font-extrabold text-[#12213A]"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
          >
            Lo que dicen nuestros usuarios
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonios.map(({ nombre, rol, empresa, texto, stars, avatar, avatarBg }) => (
            <figure
              key={nombre}
              className="card-hover bg-white border border-[#DDD6C8] rounded-2xl p-8 flex flex-col gap-6"
              style={{ boxShadow: "0 2px 12px rgba(18,33,58,0.04)" }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <span key={i} className="text-[#F59E0B] text-sm">★</span>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1">
                <p className="font-body text-[#4A4438] text-sm leading-relaxed">
                  &ldquo;{texto}&rdquo;
                </p>
              </blockquote>

              {/* Author */}
              <figcaption className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #EDE7DB" }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-body font-bold text-white text-sm"
                  style={{ background: avatarBg }}
                >
                  {avatar}
                </div>
                <div>
                  <div className="font-body font-semibold text-sm text-[#12213A]">{nombre}</div>
                  <div className="font-body text-xs text-[#7A6E60]">{rol} · {empresa}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Aggregate rating */}
        <div className="text-center mt-12 flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-[#F59E0B] text-xl">★</span>
            ))}
          </div>
          <p className="font-body text-sm text-[#7A6E60]">
            <span className="font-bold text-[#12213A]">4.9 / 5</span> basado en más de 600 usuarios activos
          </p>
        </div>
      </div>
    </section>
  )
}

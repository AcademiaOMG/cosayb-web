const steps = [
  {
    number: "01",
    title: "Carga tus ingredientes",
    description:
      "Accede a más de 1.000 ingredientes base o agrega los tuyos con precios reales del mercado colombiano.",
  },
  {
    number: "02",
    title: "Construye tus recetas",
    description:
      "Combina ingredientes, define porciones y el costo se calcula automáticamente, incluyendo subrecetas y mermas.",
  },
  {
    number: "03",
    title: "Conoce tu precio real",
    description:
      "El sistema te dice cuánto cuesta producir cada plato y a qué precio exacto deberías venderlo para ser rentable.",
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-[#F5F0E8] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-4">
            Sin fórmulas complicadas
          </span>
          <h2
            className="font-display font-bold text-[#12213A] mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Tres pasos para saber lo que vale tu cocina
          </h2>
          <p className="font-body text-[#7A6E60]">Sin Excel lleno de errores. Sin adivinar.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ number, title, description }) => (
            <div
              key={number}
              className="bg-[#FDFAF6] border border-[#DDD6C8] rounded-2xl p-8"
            >
              <div className="font-mono text-5xl font-bold text-[#1B4FD8] leading-none mb-4">
                {number}
              </div>
              <h3 className="font-body font-bold text-lg text-[#12213A] mb-2">{title}</h3>
              <p className="font-body text-sm text-[#4A4438] leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

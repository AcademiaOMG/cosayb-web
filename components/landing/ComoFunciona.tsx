import { Layers, Percent, ChefHat } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Carga tus ingredientes",
    description:
      "Accede a más de 1.000 ingredientes base o agrega los tuyos con precios reales del mercado colombiano.",
    detail: "El costo por gramo se calcula automáticamente. Actualiza precios cuando quieras.",
    Icon: Layers,
  },
  {
    number: "02",
    title: "Construye tus recetas",
    description:
      "Combina ingredientes, define porciones y el costo se calcula en tiempo real, incluyendo subrecetas y mermas.",
    detail: "Soporta recetas anidadas. Cambia una cantidad y todos los cálculos se actualizan al instante.",
    Icon: ChefHat,
  },
  {
    number: "03",
    title: "Conoce tu precio real",
    description:
      "El sistema te dice cuánto cuesta producir cada plato y a qué precio exacto deberías venderlo para ser rentable.",
    detail: "Incluye costos fijos, porcentaje de ganancia y comparación con la industria.",
    Icon: Percent,
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-[#12213A] py-14 sm:py-20 px-6 sm:px-10 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5 text-[#7AAEFF]"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Sin fórmulas complicadas
          </span>
          <h2
            className="font-display font-extrabold text-[#F5F0E8] mb-4"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
          >
            Tres pasos para saber lo que vale tu cocina
          </h2>
          <p className="font-body text-lg text-[#8FA0BC] max-w-xl mx-auto">
            Sin Excel lleno de errores. Sin adivinar. Sin contratar a nadie.
          </p>
        </div>

        {/* Steps — connector line on desktop */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[3.25rem] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0 mx-24" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map(({ number, title, description, detail, Icon }, i) => (
              <div
                key={number}
                className="card-hover rounded-2xl p-8 flex flex-col gap-5 bg-white/[0.03] border border-white/[0.06]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Step number + icon */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#7AAEFF]/10"
                  >
                    <Icon size={22} className="text-[#7AAEFF]" />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-extrabold text-sm text-[#7AAEFF]"
                    style={{ background: "rgba(122, 174, 255, 0.08)", border: "2px solid rgba(122, 174, 255, 0.20)" }}
                  >
                    {number}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.06]" />

                {/* Text */}
                <div>
                  <h3 className="font-body font-bold text-xl text-[#F5F0E8] mb-3">{title}</h3>
                  <p className="font-body text-sm text-[#8FA0BC] leading-relaxed mb-3">{description}</p>
                  <p className="font-body text-xs text-[#5C708C] leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA hint */}
        <div className="text-center mt-14">
          <p className="font-body text-sm text-[#8FA0BC]">
            ¿Listo para probarlo?{" "}
            <a href="/login" className="text-[#7AAEFF] font-semibold hover:text-white transition-all">
              Empieza gratis ahora →
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

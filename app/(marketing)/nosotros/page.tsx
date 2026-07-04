import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Target, Eye, Lightbulb, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce el equipo detrás de CO$AYB, nuestra misión de hacer rentables las cocinas colombianas y por qué nació esta herramienta.",
}

const pillars = [
  {
    Icon: Target,
    title: "Nuestra Misión",
    body: "Hacer que cada restaurante, chef y cocina profesional en Colombia tenga acceso a las herramientas de costeo que antes solo usaban las grandes cadenas. Que ningún negocio gastronómico cierre por no saber cuánto le cuesta cada plato.",
  },
  {
    Icon: Eye,
    title: "Nuestra Visión",
    body: "Ser la plataforma de referencia para la gestión de costos gastronómicos en Latinoamérica. Que cada cocina que use CO$AYB tome decisiones de negocio con números reales, no con intuición.",
  },
  {
    Icon: Lightbulb,
    title: "Por Qué Nació",
    body: "Después de capacitar a más de 600 cocineros y administradores de restaurantes, detectamos el mismo problema repetido: el conocimiento de costos existía, pero no había una herramienta asequible y específica para el mercado colombiano. CO$AYB nació para cerrar esa brecha.",
  },
  {
    Icon: Users,
    title: "A Quién Ayudamos",
    body: "Chefs propietarios, administradores de cafeterías, docentes de gastronomía y cualquier persona que necesite calcular costos de forma profesional. Si manejas una cocina y quieres ser rentable, CO$AYB es para ti.",
  },
]

const stats = [
  { value: "600+", label: "usuarios activos" },
  { value: "30.000+", label: "recetas costeadas" },
  { value: "6", label: "módulos integrados" },
  { value: "100%", label: "colombiano" },
]

export default function NosotrosPage() {
  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="bg-[#12213A] min-h-dvh flex flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
            >
              Hacemos rentables
              <br />
              <span className="text-[#7AAEFF]">las cocinas</span>
              <br />
              colombianas.
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed max-w-xl">
              CO$AYB es el software de costos de alimentos y bebidas construido específicamente para la
              realidad del negocio gastronómico colombiano. Somos parte de Academia OMG, una organización
              de formación gastronómica con más de una década de experiencia.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#EDE7DB] py-12 px-6 sm:px-10 lg:px-16"
        style={{ borderBottom: "1px solid #DDD6C8" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div
                  className="font-display font-extrabold text-[#1B4FD8]"
                  style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
                >
                  {value}
                </div>
                <div className="font-body text-sm text-[#7A6E60] mt-1 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-[#F5F0E8] py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6">
                Nuestra historia
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-6"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
              >
                El problema que
                <br />
                decidimos resolver
              </h2>
              <div className="space-y-5 font-body text-[#4A4438] leading-relaxed text-base">
                <p>
                  Durante años, los dueños de restaurantes en Colombia operaban con una creencia peligrosa:
                  si el local está lleno, el negocio va bien. La realidad era diferente: muchos tenían ventas
                  altas pero márgenes negativos.
                </p>
                <p>
                  En Academia OMG capacitamos a cientos de cocineros en costos gastronómicos. Pero notamos
                  que el conocimiento solo no era suficiente sin una herramienta que lo pusiera en práctica.
                  Las hojas de cálculo eran lentas, propensas a errores y difíciles de mantener actualizadas.
                </p>
                <p>
                  Por eso construimos CO$AYB: para que cualquier restaurante, sin importar su tamaño, pueda
                  saber exactamente cuánto le cuesta cada plato y a qué precio venderlo para ser rentable.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {pillars.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="card-hover bg-white border border-[#DDD6C8] rounded-xl p-6 flex gap-5"
                >
                  <div className="w-10 h-10 bg-[#DEEAFF] rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#1B4FD8]" />
                  </div>
                  <div>
                    <h3 className="font-body font-bold text-[#12213A] mb-2">{title}</h3>
                    <p className="font-body text-sm text-[#4A4438] leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="bg-[#12213A] py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Un SaaS construido
            <br />
            <span className="text-[#7AAEFF]">para la cocina real</span>
          </h2>
          <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-12 max-w-2xl mx-auto">
            CO$AYB no es una hoja de cálculo disfrazada. Es una plataforma diseñada desde cero para el
            flujo de trabajo real de un restaurante: ingredientes con precios colombianos, mermas reales,
            recetas anidadas y un motor de pricing que te dice cuánto cobrar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-spx btn-spx-light">
              Probar 14 días gratis
              <ArrowRight size={14} className="btn-arrow" />
            </Link>
            <Link href="/contacto" className="btn-spx btn-spx-light">
              Hablar con nosotros
              <ArrowRight size={14} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

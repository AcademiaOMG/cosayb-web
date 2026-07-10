import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Target, Eye, Lightbulb, Users, BookOpen, BarChart3, RefreshCw, Shield, TrendingUp, Smartphone } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce el equipo detrás de Academia OMG, nuestra misión de hacer rentables las cocinas colombianas y por qué nació esta herramienta.",
}

const principios = [
  {
    Icon: Lightbulb,
    title: "Innovación",
    body: "Promovemos ideas nuevas, creativas y funcionales que permitan optimizar recursos, mejorar la experiencia del cliente y fortalecer la rentabilidad del negocio.",
  },
  {
    Icon: Users,
    title: "Trabajo en Equipo",
    body: "Fomentamos la colaboración activa entre chefs, ingenieros, docentes, estudiantes y profesionales hosteleros para crear soluciones integrales y efectivas.",
  },
  {
    Icon: Target,
    title: "Orientación a Resultados",
    body: "Nos enfocamos en generar impactos reales, midiendo avances, mejorando procesos, aumentar la rentabilidad y elevar la calidad del servicio.",
  },
  {
    Icon: Shield,
    title: "Integridad",
    body: "Actuamos con transparencia, ética y responsabilidad en cada acción, generando confianza en nuestros clientes y aliados.",
  },
]

const features = [
  {
    Icon: BookOpen,
    title: "Claridad",
    description: "Aprende a entender y controlar los costos gastronómicos sin complicaciones.",
  },
  {
    Icon: TrendingUp,
    title: "Rentabilidad",
    description: "Mejora los resultados financieros de tu negocio.",
  },
  {
    Icon: BarChart3,
    title: "Prácticidad",
    description: "Aplica el aprendizaje directamente en tu operación diaria.",
  },
  {
    Icon: Shield,
    title: "Control",
    description: "Toma decisiones basadas en información real y confiable.",
  },
  {
    Icon: RefreshCw,
    title: "Actualización",
    description: "Los datos de costos de productos se actualizan diariamente para decisiones precisas.",
  },
  {
    Icon: Smartphone,
    title: "Accesibilidad",
    description: "Accede al libro, las clases y la app desde cualquier lugar y en cualquier momento.",
  },
]

const equipo = [
  { name: "Javier Gaviria", role: "Director & Fundador", initials: "JG" },
  { name: "Daniel Sánchez", role: "Director Gastronómico", initials: "DS" },
  { name: "Laura Castellanos", role: "Coord. Académica", initials: "LC" },
  { name: "Roberto Cortés", role: "Instructor & Consultor", initials: "RC" },
]

const stats = [
  { value: "2.500+", label: "Proyectos creados" },
  { value: "30.000+", label: "Recetas costeadas" },
  { value: "200+", label: "Cursos" },
  { value: "600+", label: "Cocineros" },
]

export default function NosotrosPage() {
  return (
    <div>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-[#12213A] min-h-dvh flex flex-col justify-center px-6 sm:px-10 lg:px-16">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/fondo-principal.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[#12213A]/70" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(18,33,58,1) 0%, rgba(18,33,58,0.4) 40%, transparent 100%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
            >
              Transformamos la
              <br />
              Gestión Gastronómica en
              <br />
              <span className="text-[#7AAEFF]">Resultados Reales</span>
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed max-w-xl">
              Somos un equipo de expertos en gestión gastronómica enfocado en ayudar a negocios del sector
              alimentos y bebidas a mejorar su operación, optimizar recursos y aumentar su rentabilidad.
              Nuestra experiencia, visión y compromiso nos permiten ofrecer soluciones prácticas y
              efectivas, respaldadas por la innovación y la capacidad actual.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="bg-[#F5F0E8] py-12 px-6 sm:px-10 lg:px-16" style={{ borderBottom: "1px solid #DDD6C8" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display font-extrabold text-[#1B4FD8]" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
                  {value}
                </div>
                <div className="font-body text-sm text-[#7A6E60] mt-1 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRINCIPIOS ═══════════════ */}
      <section className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Image */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div
                  className="absolute -inset-4 rounded-2xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cerca-de-chef-cocinando-en-la-cocina-del-restaurante-scaled.webp"
                  alt="Equipo de Academia OMG"
                  className="relative rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover"
                  style={{ boxShadow: "0 32px 80px rgba(18,33,58,0.30)" }}
                />
              </div>
            </div>

            {/* Right — Principles */}
            <div>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
                Nuestros valores
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-10"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                Nuestros Principios
                <br />
                <span className="text-[#1B4FD8]">Fundamentales</span>
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                {principios.map(({ Icon, title, body }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 bg-[#DEEAFF] rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#1B4FD8]" />
                    </div>
                    <div>
                      <h3 className="font-body font-bold text-[#12213A] text-sm mb-1">{title}</h3>
                      <p className="font-body text-xs text-[#4A4438] leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NUESTRA HISTORIA ═══════════════ */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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

            {/* Image placeholder */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div
                  className="absolute -inset-4 rounded-2xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                <div
                  className="relative rounded-2xl overflow-hidden aspect-[4/3]"
                  style={{ background: "linear-gradient(135deg, #12213A 0%, #1B4FD8 100%)", boxShadow: "0 32px 80px rgba(18,33,58,0.30)" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-8">
                      <div className="font-display font-extrabold text-[#F5F0E8] text-3xl mb-2">Costos</div>
                      <div className="font-body text-sm text-[#8FA0BC]">&amp; Alimentos Bebidas</div>
                      <div className="font-body text-xs text-[#8FA0BC] mt-2">Análisis y Gestión en Operaciones Gastronómicas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TODO EN UN SOLO LUGAR ═══════════════ */}
      <section className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — Image + text */}
            <div>
              <h2
                className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-6"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                Todo en un solo
                <br />
                <span className="text-[#1B4FD8]">lugar para gestionar</span>
                <br />
                tus costos
              </h2>
              <div className="space-y-4 font-body text-[#4A4438] leading-relaxed text-base">
                <p>
                  En <strong className="text-[#12213A]">Academia OMG</strong> encontramos una solución integral: el{" "}
                  <strong className="text-[#12213A]">libro</strong> que explica los fundamentos, las{" "}
                  <strong className="text-[#12213A]">clases</strong> que los llevan a la práctica paso a paso
                  y la <strong className="text-[#12213A]">app</strong> que te permite aplicar y controlar tus costos en
                  tiempo real.
                </p>
                <p>
                  Esta combinación te ayuda a aprender, ejecutar y tomar decisiones con claridad,
                  convirtiendo el conocimiento en resultados tangibles para tu operación día a día, práctica y eficiente.
                </p>
              </div>

              {/* Book mockup */}
              <div className="mt-8 relative w-full max-w-sm">
                <div
                  className="absolute -inset-3 rounded-2xl opacity-15"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/libro-costos.webp"
                  alt="Libro de Costos A&B"
                  className="relative rounded-xl shadow-xl w-full"
                  style={{ boxShadow: "0 20px 60px rgba(18,33,58,0.25)" }}
                />
              </div>
            </div>

            {/* Right — Features grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map(({ Icon, title, description }) => (
                <div
                  key={title}
                  className="card-hover bg-white border border-[#DDD6C8] rounded-2xl p-6 flex flex-col gap-4"
                >
                  <div className="w-10 h-10 bg-[#DEEAFF] rounded-lg flex items-center justify-center">
                    <Icon size={18} className="text-[#1B4FD8]" />
                  </div>
                  <div>
                    <h3 className="font-body font-bold text-[#12213A] mb-1">{title}</h3>
                    <p className="font-body text-sm text-[#4A4438] leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ NUESTRO EQUIPO ═══════════════ */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
              El equipo
            </span>
            <h2
              className="font-display font-extrabold text-[#12213A] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Nuestro equipo
            </h2>
            <p className="font-body text-base text-[#7A6E60] max-w-2xl mx-auto">
              Está conformado por profesionales de la gastronomía y la gestión, con experiencia en cocina,
              bar, administración y control de costos. Trabajamos de forma práctica y colaborativa para
              apoyar el crecimiento, la eficiencia y la rentabilidad de cada proyecto gastronómico.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {equipo.map(({ name, role, initials }) => (
              <div key={name} className="text-center card-hover bg-white border border-[#DDD6C8] rounded-2xl p-6">
                <div className="w-20 h-20 rounded-full bg-[#12213A] flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-extrabold text-[#F5F0E8] text-xl">{initials}</span>
                </div>
                <h3 className="font-body font-bold text-sm text-[#12213A]">{name}</h3>
                <p className="font-body text-xs text-[#7A6E60] mt-1">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="bg-[#F5F0E8] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Un SaaS construido
            <br />
            <span className="text-[#1B4FD8]">para la cocina real</span>
          </h2>
          <p className="font-body text-lg text-[#4A4438] leading-relaxed mb-12 max-w-2xl mx-auto">
            CO$AYB no es una hoja de cálculo disfrazada. Es una plataforma diseñada desde cero para el
            flujo de trabajo real de un restaurante: ingredientes con precios colombianos, mermas reales,
            recetas anidadas y un motor de pricing que te dice cuánto cobrar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn-spx btn-spx-accent">
              Probar 14 días gratis
              <ArrowRight size={14} className="btn-arrow" />
            </Link>
            <Link href="/contacto" className="btn-spx btn-spx-dark">
              Hablar con nosotros
              <ArrowRight size={14} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, BookOpen, Package, ChefHat, Scale, BarChart3 } from "lucide-react"

const PROGRAM_SLUG: Record<string, string> = {
  "Introducción": "introduccion",
  "Gestión de Almacén": "almacen",
  "La Receta": "receta",
  "Factor de Rendimiento": "rendimiento",
  "Gestión del Costo": "costo",
  "Diplomado en Gestión de Costos A&B": "diplomado",
}

const tracks = [
  {
    title: "Formación en Gastronomía",
    description: "Herramientas claras y aplicables para tomar decisiones reales en tu operación gastronómica.",
    image: "/images/cerca-de-chef-cocinando-en-la-cocina-del-restaurante-scaled.webp",
  },
  {
    title: "Formación en Costos del Bar",
    description: "Convierte el control de costos en rentabilidad para tu bar.",
    image: "/images/imagen-hero-capacitacion.webp",
  },
]

const programas = [
  {
    icon: BookOpen,
    name: "Introducción",
    description: "Curso básico sobre costos gastronómicos: conceptos fundamentales, definiciones y tipos de costos.",
    price: "$150.000 COP",
  },
  {
    icon: Package,
    name: "Gestión de Almacén",
    description: "Inventarios, productos, máximos y mínimos, control de entradas y salidas.",
    price: "$150.000 COP",
  },
  {
    icon: ChefHat,
    name: "La Receta",
    description: "Herramienta esencial para calcular costos de preparaciones profesionales.",
    price: "$150.000 COP",
  },
  {
    icon: Scale,
    name: "Factor de Rendimiento",
    description: "Calcula el costo real de los insumos después de mermas, limpieza y rendimiento.",
    price: "$150.000 COP",
  },
  {
    icon: BarChart3,
    name: "Gestión del Costo",
    description: "Integración completa del sistema de costos: resumen, análisis y consolidación.",
    price: "$150.000 COP",
  },
]

const programaOptions = [
  "Introducción",
  "Gestión de Almacén",
  "La Receta",
  "Factor de Rendimiento",
  "Gestión del Costo",
  "Diplomado en Gestión de Costos A&B",
]

const inversionPorPrograma: Record<string, number> = {
  "Introducción": 150000,
  "Gestión de Almacén": 150000,
  "La Receta": 150000,
  "Factor de Rendimiento": 150000,
  "Gestión del Costo": 150000,
  "Diplomado en Gestión de Costos A&B": 700000,
}

function formatCOP(value: number) {
  return `$${value.toLocaleString("es-CO")} COP`
}

export default function CapacitacionPage() {
  const router = useRouter()
  const [selectedProgram, setSelectedProgram] = useState<string>("Diplomado en Gestión de Costos A&B")

  function goToEnrollment(programa: string) {
    const slug = PROGRAM_SLUG[programa] ?? "introduccion"
    router.push(`/courses/${slug}/enrollment`)
  }

  function handleSelectPrograma(programa: string) {
    goToEnrollment(programa)
  }

  return (
    <div>

      {/* ─── HERO ─────────────────────────────────────────────────── */}

      <section className="relative overflow-hidden min-h-dvh">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/imagen-hero-capacitacion.webp"
          alt="Capacitación gastronómica"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0A1520]/60" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1520] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center min-h-dvh pt-24 pb-16">
          <div className="max-w-2xl animate-fade-up">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Capacitación especializada
              <br />
              <span className="text-[#7AAEFF]">para negocios gastronómicos rentables</span>
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-xl animate-fade-up-delay-2">
              Aprende a controlar costos, optimizar inventarios y aumentar la rentabilidad de tu operación mediante programas prácticos desarrollados por Academia OMG.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a href="#programas" className="btn-spx btn-spx-accent-solid">
                Ver programas
                <ArrowRight size={16} className="btn-arrow" />
              </a>
              <a href="#formulario" className="btn-spx btn-spx-light">
                Solicitar información
                <ArrowRight size={16} className="btn-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRACKS ──────────────────────────────────────────────── */}

      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
              Formación
            </span>
            <h2
              className="font-display font-extrabold text-[#12213A] mb-3"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
            >
              Elige tu camino
            </h2>
            <p className="font-body text-lg text-[#7A6E60]">
              Dos tracks diseñados para diferentes necesidades del sector gastronómico.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {tracks.map((track) => (
              <div
                key={track.title}
                className="card-hover bg-white border border-[#DDD6C8] rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1520]/70 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6">
                    <h3 className="font-display font-extrabold text-white text-xl">
                      {track.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="font-body text-sm text-[#4A4438] leading-relaxed">
                    {track.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROGRAMAS ────────────────────────────────────────────── */}

      <section id="programas" className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-5">
                Programas
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] mb-3"
                style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)" }}
              >
                Formación práctica
                <br />
                para tu negocio
              </h2>
              <p className="font-body text-lg text-[#7A6E60]">
                Cinco programas diseñados para dominar los costos gastronómicos.
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-5">
            {/* First row: 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {programas.slice(0, 3).map(({ icon: Icon, name, description, price }) => (
                <div
                  key={name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPrograma(name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectPrograma(name)
                    }
                  }}
                  className="card-hover cursor-pointer bg-[#FDFAF6] border border-[#DDD6C8] hover:border-[#1B4FD8]/40 rounded-2xl p-7 flex flex-col gap-5"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#DEEAFF]">
                    <Icon size={22} className="text-[#1B4FD8]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-body font-bold text-base text-[#12213A] mb-2">{name}</h3>
                    <p className="font-body text-sm leading-relaxed text-[#4A4438]">{description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="inline-block text-sm font-bold px-4 py-2 rounded-xl bg-[#12213A] text-[#F5F0E8]">
                      {price}
                    </span>
                    <span className="font-body text-xs font-semibold text-[#1B4FD8]">Inscribirme →</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Second row: 2 cards centered */}
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              {programas.slice(3).map(({ icon: Icon, name, description, price }) => (
                <div
                  key={name}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectPrograma(name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelectPrograma(name)
                    }
                  }}
                  className="card-hover cursor-pointer bg-[#FDFAF6] border border-[#DDD6C8] hover:border-[#1B4FD8]/40 rounded-2xl p-7 flex flex-col gap-5 w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.667rem)]"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#DEEAFF]">
                    <Icon size={22} className="text-[#1B4FD8]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-body font-bold text-base text-[#12213A] mb-2">{name}</h3>
                    <p className="font-body text-sm leading-relaxed text-[#4A4438]">{description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="inline-block text-sm font-bold px-4 py-2 rounded-xl bg-[#12213A] text-[#F5F0E8]">
                      {price}
                    </span>
                    <span className="font-body text-xs font-semibold text-[#1B4FD8]">Inscribirme →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── DIPLOMADO ────────────────────────────────────────────── */}

      <section className="relative overflow-hidden py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cerca-de-chef-cocinando-en-la-cocina-del-restaurante-scaled.webp"
          alt="Diplomado en Gestión de Costos de Alimentos y Bebidas"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0A1520]/70" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A1520] to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6 text-[#7AAEFF]"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            Diplomado
          </span>

          <h2
            className="font-display font-extrabold text-[#F5F0E8] leading-[1.05] mb-6"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            Diplomado en Gestión de Costos
            <br />
            <span className="text-[#7AAEFF]">de Alimentos y Bebidas</span>
          </h2>

          <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-8 max-w-2xl mx-auto">
            Un programa formativo integral que te enseñará los fundamentos de los costos, la gestión
            de inventarios, el análisis de recetas, el factor de rendimiento, el control financiero y la
            toma de decisiones para una gestión gastronómica eficiente y rentable.
          </p>

          <div
            className="font-display font-extrabold text-[#7AAEFF] mb-8"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            $700.000 COP
          </div>

          <button
            type="button"
            onClick={() => handleSelectPrograma("Diplomado en Gestión de Costos A&B")}
            className="btn-spx btn-spx-light"
          >
            Quiero inscribirme
            <ArrowRight size={16} className="btn-arrow" />
          </button>
        </div>
      </section>

      {/* ─── FORMULARIO ───────────────────────────────────────────── */}

      <section id="formulario" className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-stretch">
            {/* Left — Title + Subtitle + Image */}
            <div className="flex flex-col">
              <h2
                className="font-display font-extrabold text-[#12213A] mb-0"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                ¿Listo para capacitarte?
              </h2>

              <p className="font-body text-base text-[#4A4438] leading-relaxed mt-4 mb-0">
                No pierdas la oportunidad de aprender a hacer rentable tu negocio.
                Descubre cómo nuestras capacitaciones y acompañamiento pueden transformar tu
                operación en un negocio sensible y exitoso.
              </p>

              <div className="relative mt-14 p-3 aspect-[4/5] lg:aspect-auto lg:flex-1">
                <div
                  className="absolute inset-0 rounded-2xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/cocinera-en-la-cocina-usando-un-dispositivo-portatil-scaled.webp"
                  alt="Capacitación gastronómica"
                  className="relative rounded-xl shadow-2xl w-full h-full object-cover"
                  style={{ boxShadow: "0 32px 80px rgba(18,33,58,0.30)" }}
                />
              </div>
            </div>

            {/* Right — Inscripción */}
            <div>
              <div
                className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col gap-5"
                style={{ border: "1px solid #DDD6C8" }}
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="programa" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                    Programa de inscripción
                  </label>
                  <select
                    id="programa"
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                    style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                  >
                    {programaOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="font-body text-sm text-[#4A4438]">
                  Continúa a un formulario completo con tus datos, revisión y confirmación de la solicitud. No
                  necesitas crear una cuenta.
                </p>
                <button
                  type="button"
                  onClick={() => goToEnrollment(selectedProgram)}
                  className="btn-spx btn-spx-accent self-start"
                >
                  Inscribirme
                  <ArrowRight size={16} className="btn-arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

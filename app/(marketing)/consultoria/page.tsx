"use client"

import { useState, useEffect } from "react"
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    title: "Diagnóstico",
    description: "Evaluación precisa de la estructura real de costos de tu operación gastronómica.",
    image: "/images/fondo-principal.webp",
  },
  {
    title: "Acompañamiento",
    description: "Plan de acción personalizado con herramientas prácticas para optimizar tu rentabilidad.",
    image: "/images/imagen-hero-capacitacion.webp",
  },
  {
    title: "Resultados",
    description: "Medimos el impacto real en tu negocio: costos controlados, márgenes mejores,Decisiones inteligentes.",
    image: "/images/cerca-de-chef-cocinando-en-la-cocina-del-restaurante-scaled.webp",
  },
]

const areasInteres = [
  "Costos de alimentos",
  "Costos de bebidas",
  "Control de inventario",
  "Estandarización de recetas",
  "Rentabilidad",
  "Gestión administrativa",
]

export default function ConsultoriaPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    negocio: "",
    tipoNegocio: "",
    ciudad: "",
    areas: [] as string[],
    diagnostico: "",
    comoNosConociste: "",
    autorizacion: false,
  })
  const [sent, setSent] = useState(false)

  function goToSlide(next: number) {
    if (isAnimating || next === currentSlide) return
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentSlide(next)
      setIsAnimating(false)
    }, 400)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  function handleAreaToggle(area: string) {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[70vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/fondo-principal.webp"
          alt="Consultoría gastronómica"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0A1520]/60" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1520] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center min-h-[70vh]">
          <div className="max-w-2xl animate-fade-up">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Acompañamiento
              <br />
              <span className="text-[#7AAEFF]">Profesional</span>
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-xl animate-fade-up-delay-2">
              Orientación experta para potenciar la administración y el desempeño gastronómico.
              Evaluamos tu operación y diseñamos un plan de mejora personalizado.
            </p>
            <a href="#formulario" className="btn-spx btn-spx-accent animate-fade-up-delay-3">
              Solicitar asesoría
              <ArrowRight size={16} className="btn-arrow" />
            </a>
          </div>
        </div>
      </section>

      

      {/* ─── GESTIÓN INTELIGENTE ──────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-[#DEEAFF] text-[#1434A4] text-xs font-body font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6">
                Consultoría
              </span>
              <h2
                className="font-display font-extrabold text-[#12213A] leading-[1.05] mb-6"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                Gestión Inteligente de
                <br />
                <span className="text-[#1B4FD8]">Costos A & B</span>
              </h2>
              <p className="font-body text-base text-[#4A4438] leading-relaxed mb-6">
                Te invitamos a dar el siguiente paso en la administración de tu operación gastronómica.
                A través de una gestión inteligente de los costos de Alimentos y Bebidas, aprenderás a
                optimizar recursos, reducir desperdicios y fortalecer la rentabilidad de tu restaurante.
              </p>
              <p className="font-body text-base text-[#4A4438] leading-relaxed">
                Nuestro acompañamiento te permitirá reducir desperdicios, mejorar la rentabilidad y
                fortalecer la sostenibilidad de tu negocio de forma práctica y aplicada.
              </p>
            </div>
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
                      <div className="font-display font-extrabold text-[#F5F0E8] text-3xl mb-2">A & B</div>
                      <div className="font-body text-sm text-[#8FA0BC]">Gestión de Costos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* ─── SLIDER ────────────────────────────────────────────────── */}
      <section className="bg-[#12213A] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/7]">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
                style={{ transitionProperty: "opacity" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[2000ms] ease-out ${
                    i === currentSlide ? "scale-100" : "scale-110"
                  }`}
                />
                <div className="absolute inset-0 bg-[#0A1520]/50" />
                <div className="absolute inset-0 flex items-center justify-center text-center px-8">
                  <div className={`transition-all duration-700 ease-out ${
                    i === currentSlide
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  }`}>
                    <h2
                      className="font-display font-extrabold text-[#F5F0E8] mb-4"
                      style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                    >
                      {slide.title}
                    </h2>
                    <p className="font-body text-lg text-[#C8D5E8] max-w-xl mx-auto">
                      {slide.description}
                    </p>
                    <a href="#formulario" className="btn-spx btn-spx-light mt-8 inline-flex">
                      Leer más
                      <ArrowRight size={16} className="btn-arrow" />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation arrows */}
            <button
              onClick={() => goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
              aria-label="Slide anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => goToSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-20"
              aria-label="Siguiente slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "bg-[#7AAEFF] scale-125" : "bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FORMULARIO ───────────────────────────────────────────── */}
      <section id="formulario" className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-display font-extrabold text-[#12213A] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Da el primer paso hacia una
              <br />
              <span className="text-[#1B4FD8]">mejor gestión</span>
            </h2>
            <p className="font-body text-base text-[#4A4438] max-w-2xl mx-auto">
              Completa el siguiente formulario y cuéntanos cómo es tu negocio gastronómico.
              Con esa información haremos un análisis preliminar para diseñar una propuesta de
              acompañamiento enfocada en optimizar recursos y aumentar la rentabilidad de tu operación.
            </p>
          </div>

          {sent ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <CheckCircle size={48} className="text-[#1B4FD8] mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl text-[#12213A] mb-3">
                ¡Solicitud recibida!
              </h3>
              <p className="font-body text-sm text-[#4A4438]">
                Nuestro equipo de consultores te contactará en las próximas 24 horas hábiles
                para agendar una sesión de diagnóstico inicial.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col gap-6"
              style={{ border: "1px solid #DDD6C8" }}
            >
              {/* Datos de contacto */}
              <div>
                <h3 className="font-body font-bold text-[#12213A] text-base mb-4">Datos de contacto</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nombre" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Nombre completo *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Nombre y apellido"
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="correo" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Correo electrónico *
                    </label>
                    <input
                      id="correo"
                      name="correo"
                      type="email"
                      required
                      value={form.correo}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor="telefono" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      required
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Número de contacto"
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>
                </div>
              </div>

              {/* Información del negocio */}
              <div>
                <h3 className="font-body font-bold text-[#12213A] text-base mb-4">Información del negocio</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="negocio" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Nombre del negocio
                    </label>
                    <input
                      id="negocio"
                      name="negocio"
                      type="text"
                      value={form.negocio}
                      onChange={handleChange}
                      placeholder="Nombre del establecimiento"
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tipoNegocio" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Tipo de negocio
                    </label>
                    <select
                      id="tipoNegocio"
                      name="tipoNegocio"
                      value={form.tipoNegocio}
                      onChange={handleChange}
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none appearance-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    >
                      <option value="" disabled>Seleccione una opción</option>
                      <option value="restaurante">Restaurante</option>
                      <option value="cafeteria">Cafetería</option>
                      <option value="panaderia">Panadería</option>
                      <option value="food-truck">Food Truck</option>
                      <option value="cloud-kitchen">Cloud Kitchen</option>
                      <option value="catering">Catering</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ciudad" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Ciudad / País
                    </label>
                    <input
                      id="ciudad"
                      name="ciudad"
                      type="text"
                      value={form.ciudad}
                      onChange={handleChange}
                      placeholder="Ciudad y país"
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>
                </div>
              </div>

              {/* Operación gastronómica */}
              <div>
                <h3 className="font-body font-bold text-[#12213A] text-base mb-4">Operación gastronómica</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                    Áreas de interés
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {areasInteres.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => handleAreaToggle(area)}
                        className={`font-body text-sm px-4 py-2 rounded-lg border transition-colors ${
                          form.areas.includes(area)
                            ? "bg-[#1B4FD8] text-white border-[#1B4FD8]"
                            : "bg-white text-[#12213A] border-[#DDD6C8] hover:border-[#1B4FD8]/40"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Diagnóstico inicial */}
              <div>
                <h3 className="font-body font-bold text-[#12213A] text-base mb-4">Diagnóstico inicial</h3>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="diagnostico" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                    Principal necesidad o problema
                  </label>
                  <textarea
                    id="diagnostico"
                    name="diagnostico"
                    rows={4}
                    value={form.diagnostico}
                    onChange={handleChange}
                    placeholder="Ej: costos altos, desperdicios, falta de control, precios mal calculados"
                    className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none resize-none"
                    style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <label htmlFor="comoNosConociste" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                    ¿Cómo nos conociste? (opcional)
                  </label>
                  <input
                    id="comoNosConociste"
                    name="comoNosConociste"
                    type="text"
                    value={form.comoNosConociste}
                    onChange={handleChange}
                    placeholder="Redes sociales, recomendación, web, otro"
                    className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                    style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                  />
                </div>
              </div>

              {/* Autorización */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autorizacion"
                  name="autorizacion"
                  checked={form.autorizacion}
                  onChange={handleChange}
                  className="mt-1 accent-[#1B4FD8]"
                />
                <label htmlFor="autorizacion" className="font-body text-xs text-[#7A6E60] leading-relaxed">
                  Acepto ser contactado por Academia OMG.
                </label>
              </div>

              <button
                type="submit"
                className="btn-spx btn-spx-accent self-start"
              >
                Solicitar asesoría
                <ArrowRight size={16} className="btn-arrow" />
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  )
}

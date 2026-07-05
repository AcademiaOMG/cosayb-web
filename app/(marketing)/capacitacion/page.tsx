"use client"

import { useState } from "react"
import { ArrowRight, BookOpen, Package, ChefHat, Scale, BarChart3, CheckCircle } from "lucide-react"

const programas = [
  {
    icon: BookOpen,
    name: "Introducción",
    description: "Curso básico sobre costos gastronómicos.",
    price: "$150.000",
  },
  {
    icon: Package,
    name: "Gestión de Almacén",
    description: "Inventarios, productos, máximos y mínimos.",
    price: "$150.000",
  },
  {
    icon: ChefHat,
    name: "La Receta",
    description: "Costeo profesional de recetas.",
    price: "$150.000",
  },
  {
    icon: Scale,
    name: "Factor de Rendimiento",
    description: "Mermas, limpieza y rendimiento de ingredientes.",
    price: "$150.000",
  },
  {
    icon: BarChart3,
    name: "Gestión del Costo",
    description: "Integración completa del sistema de costos.",
    price: "$150.000",
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

export default function CapacitacionPage() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    ciudad: "",
    programa: "",
    mensaje: "",
  })
  const [sent, setSent] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
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

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center min-h-dvh">
          <div className="max-w-2xl animate-fade-up">
            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Capacitación especializada
              <br />
              <span className="text-[#7AAEFF]">para restaurantes rentables</span>
            </h1>
            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-xl animate-fade-up-delay-2">
              Aprende a controlar costos, optimizar inventarios y aumentar la rentabilidad de tu negocio gastronómico mediante programas prácticos desarrollados por Academia OMG.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a href="#programas" className="btn-spx btn-spx-accent">
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
                para tu cocina
              </h2>
              <p className="font-body text-lg text-[#7A6E60]">
                Cinco programas diseñados para dominar los costos gastronómicos.
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {programas.map(({ icon: Icon, name, description, price }) => (
              <div
                key={name}
                className="card-hover bg-[#FDFAF6] border border-[#DDD6C8] hover:border-[#1B4FD8]/40 rounded-2xl p-7 flex flex-col gap-5"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#DEEAFF]">
                  <Icon size={22} className="text-[#1B4FD8]" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className="font-body font-bold text-base text-[#12213A] mb-2">
                    {name}
                  </h3>
                  <p className="font-body text-sm leading-relaxed text-[#4A4438]">
                    {description}
                  </p>
                </div>

                {/* Price badge */}
                <span className="inline-block self-start text-[11px] font-semibold px-3 py-1 rounded-full bg-[#DEEAFF] text-[#1434A4]">
                  {price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIPLOMADO ────────────────────────────────────────────── */}

      <section className="relative overflow-hidden py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
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
            Programa integral para dominar inventarios, recetas, factor de rendimiento, control de costos y rentabilidad.
          </p>

          <div
            className="font-display font-extrabold text-[#7AAEFF] mb-8"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            $700.000 COP
          </div>

          <a href="#formulario" className="btn-spx btn-spx-light">
            Quiero inscribirme
            <ArrowRight size={16} className="btn-arrow" />
          </a>
        </div>
      </section>

      {/* ─── FORMULARIO ───────────────────────────────────────────── */}

      <section id="formulario" className="bg-[#F5F0E8] py-16 sm:py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — Title + Subtitle + Image */}
            <div>
              <h2
                className="font-display font-extrabold text-[#12213A] mb-0"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                ¿Listo para capacitarte?
              </h2>

              <p className="font-body text-base text-[#4A4438] leading-relaxed mt-4 mb-0">
                Déjanos tus datos y nos pondremos en contacto contigo para brindarte más información sobre los programas y el diplomado.
              </p>

              <div className="mt-14 flex justify-center lg:justify-start">
                <div className="relative">
                  <div
                    className="absolute -inset-4 rounded-2xl opacity-20"
                    style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/cocinera-en-la-cocina-usando-un-dispositivo-portatil-scaled.webp"
                    alt="Capacitación gastronómica"
                    className="relative rounded-xl shadow-2xl w-full max-w-lg"
                    style={{ boxShadow: "0 32px 80px rgba(18,33,58,0.30)" }}
                  />
                </div>
              </div>
            </div>

            {/* Right — Form */}
            <div>
              {sent ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <CheckCircle size={48} className="text-[#1B4FD8] mx-auto mb-4" />
                  <h3 className="font-display font-bold text-2xl text-[#12213A] mb-3">
                    ¡Solicitud recibida!
                  </h3>
                  <p className="font-body text-sm text-[#4A4438]">
                    Nos comunicaremos contigo en las próximas 24 horas hábiles con toda la información.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col gap-5"
                  style={{ border: "1px solid #DDD6C8" }}
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Nombre */}
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
                        placeholder="Tu nombre"
                        className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                        style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                      />
                    </div>

                    {/* Correo */}
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
                        placeholder="tu@email.com"
                        className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                        style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="flex flex-col gap-1.5">
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
                        placeholder="+57 300 000 0000"
                        className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                        style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                      />
                    </div>

                    {/* Ciudad */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="ciudad" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                        Ciudad
                      </label>
                      <input
                        id="ciudad"
                        name="ciudad"
                        type="text"
                        value={form.ciudad}
                        onChange={handleChange}
                        placeholder="Bogotá"
                        className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none"
                        style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                      />
                    </div>
                  </div>

                  {/* Programa de interés */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="programa" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Programa de interés *
                    </label>
                    <select
                      id="programa"
                      name="programa"
                      required
                      value={form.programa}
                      onChange={handleChange}
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none appearance-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    >
                      <option value="" disabled>
                        Selecciona un programa
                      </option>
                      {programaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mensaje */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mensaje" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                      Mensaje
                    </label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      rows={4}
                      value={form.mensaje}
                      onChange={handleChange}
                      placeholder="Cuéntanos en qué te gustaría capacitarte..."
                      className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none resize-none"
                      style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                    />
                  </div>

                  <button type="submit" className="btn-spx btn-spx-accent self-start">
                    Enviar solicitud
                    <ArrowRight size={16} className="btn-arrow" />
                  </button>

                  <p className="font-body text-xs text-[#7A6E60]">
                    * Campos obligatorios. Nos contactaremos contigo en menos de 24 horas hábiles.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

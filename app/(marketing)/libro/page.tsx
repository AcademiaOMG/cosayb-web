"use client"

import { ArrowRight, CheckCircle, MapPin, Clock, Mail, Phone, BookOpen } from "lucide-react"

const benefits = [
  "Costeo de recetas con precisión",
  "Ingeniería de menú y rentabilidad",
  "Control de inventarios y mermas",
  "Cálculo del punto de equilibrio",
  "Análisis de rentabilidad por plato",
  "Casos reales de negocios gastronómicos colombianos",
]

const contactCards = [
  {
    Icon: MapPin,
    title: "Dirección",
    value: "Avenida Calle 38B #24",
    detail: "Bogotá, Colombia",
  },
  {
    Icon: Clock,
    title: "Horario",
    value: "Lun – Vie · 8:00 AM – 5 PM",
    detail: "Hora Colombia (UTC−5)",
  },
  {
    Icon: Mail,
    title: "Email Address",
    value: "info@academiaomg.com",
    detail: "Respuesta en menos de 24 h",
  },
  {
    Icon: Phone,
    title: "Teléfonos",
    value: "+57 321 574983",
    detail: "Llamadas y WhatsApp",
  },
]

export default function LibroPage() {
  return (
    <div>

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-dvh">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/libro-hero.webp"
          alt="Libro de Costos de Alimentos y Bebidas"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0A1520]/60" />
        {/* Gradient bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1520] to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center min-h-dvh">
          <div className="max-w-2xl animate-fade-up">
            <span
              className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-6 text-[#7AAEFF]"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              El libro
            </span>

            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Costos de Alimentos
              <br />
              <span className="text-[#7AAEFF]">&amp; Bebidas</span>
            </h1>

            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-xl animate-fade-up-delay-2">
              El aliado práctico y fundamentado para negocios gastronómicos, estudiantes y profesionales, enfocado en mostrar
              cómo manejar los costos, optimizar los recursos y comprender la estructura financiera de una operación
              gastronómica.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a href="#comprar" className="btn-spx btn-spx-accent-solid">
                Comprar libro
                <ArrowRight size={16} className="btn-arrow" />
              </a>
              <a href="#about" className="btn-spx btn-spx-light">
                Ver descripción
                <ArrowRight size={16} className="btn-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT (two-column) ──────────────────────────────────── */}
      <section id="about" className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Book cover, at its natural proportions, capped to a sensible size */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-full max-w-md">
                <div
                  className="absolute -inset-4 rounded-2xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/libro-costos.webp"
                  alt="Portada del libro Costos de Alimentos y Bebidas"
                  className="relative rounded-xl shadow-2xl w-full"
                  style={{ boxShadow: "0 32px 80px rgba(18,33,58,0.30)" }}
                />
              </div>
            </div>

            {/* Right — Description + benefits */}
            <div>
              <span
                className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-6 text-[#1434A4]"
                style={{ background: "#DEEAFF" }}
              >
                Sobre el libro
              </span>

              <h2
                className="font-display font-extrabold text-[#12213A] mb-6"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                Descripción
              </h2>

              <p className="font-body text-base text-[#4A4438] leading-relaxed mb-6">
                El libro <strong className="text-[#12213A]">Costos de Alimentos y Bebidas</strong> presenta una guía técnica y
                práctica para la gestión integral de costos en la operación gastronómica. Incluye con
                matemáticas básicas, pesos, medidas y el uso del gramo como base del sistema de costos,
                y aborda la importancia de la productividad, el factor de rendimiento y el control eficiente de
                mermas. Además, se exploran temas clave como la estructura de costos, el cálculo de precios,
                margen de contribución, punto de equilibrio, contrato operativo y formatos administrativos
                esenciales.
              </p>

              {/* Benefits list */}
              <ul className="flex flex-col gap-3 mb-10">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-[#1B4FD8] shrink-0" />
                    <span className="font-body text-sm font-medium text-[#12213A]">{b}</span>
                  </li>
                ))}
              </ul>

              {/* Highlight card */}
              <div
                className="rounded-xl p-5 flex items-start gap-4"
                style={{ background: "#12213A" }}
              >
                <BookOpen size={22} className="text-[#7AAEFF] shrink-0 mt-0.5" />
                <p className="font-body text-sm text-[#8FA0BC] leading-relaxed">
                  <strong className="text-[#F5F0E8] font-semibold">
                    Más de 200 páginas
                  </strong>{" "}
                  de contenido práctico diseñado exclusivamente para negocios
                  gastronómicos profesionales en Colombia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PURCHASE FORM ──────────────────────────────────────── */}
      <section id="comprar" className="bg-[#EDE7DB] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-display font-extrabold text-[#12213A] mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Compra el libro
              <br />
              <span className="text-[#1B4FD8]">Costos de Alimentos &amp; Bebidas</span>
            </h2>
            <p className="font-body text-base text-[#4A4438] mt-4 max-w-lg mx-auto">
              Selecciona el formato de tu preferencia y completa tus datos para continuar con la compra.
            </p>
          </div>

          <div
            className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col gap-6"
            style={{ border: "1px solid #DDD6C8" }}
          >
            <div>
              <h3 className="font-body font-bold text-[#12213A] text-base mb-4">Elige el formato</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { format: "fisico", label: "Libro físico", price: "$250.000 COP", detail: "Entrega a tu dirección" },
                  { format: "digital", label: "Libro digital (PDF)", price: "$100.000 COP", detail: "Disponible desde tu cuenta" },
                ].map((o) => (
                  <a
                    key={o.format}
                    href={`/checkout/book?format=${o.format}`}
                    className="flex flex-col gap-2 rounded-xl border border-[#DDD6C8] bg-[#FDFAF6] p-5 transition hover:border-[#1B4FD8]"
                  >
                    <span className="font-body font-bold text-[#12213A]">{o.label}</span>
                    <span className="font-mono text-lg font-bold text-[#12213A]">{o.price}</span>
                    <span className="font-body text-xs text-[#7A6E60]">{o.detail}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1B4FD8]">
                      Comprar libro <ArrowRight size={14} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
            <p className="font-body text-xs text-[#7A6E60]">
              Checkout con datos del comprador, método de pago y confirmación. El pago es simulado — no se realiza
              ningún cobro real.
            </p>
          </div>

        </div>
      </section>

      {/* ─── CONTACT CARDS ───────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-display font-extrabold text-[#12213A]"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
            >
              Contact Us
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactCards.map(({ Icon, title, value, detail }) => (
              <div
                key={title}
                className="card-hover bg-white border border-[#DDD6C8] rounded-xl p-6 flex flex-col gap-4"
              >
                <div className="w-11 h-11 bg-[#DEEAFF] rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#1B4FD8]" />
                </div>
                <div>
                  <div className="font-body font-semibold text-xs text-[#7A6E60] uppercase tracking-wide mb-1">
                    {title}
                  </div>
                  <div className="font-body font-bold text-[#12213A] text-base mb-1">
                    {value}
                  </div>
                  <div className="font-body text-xs text-[#7A6E60]">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

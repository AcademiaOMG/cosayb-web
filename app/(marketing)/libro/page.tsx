"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle, MapPin, Clock, Mail, Phone, BookOpen } from "lucide-react"
import { useState } from "react"

const benefits = [
  "Costeo de recetas con precisión",
  "Ingeniería de menú y rentabilidad",
  "Control de inventarios y mermas",
  "Cálculo del punto de equilibrio",
  "Análisis de rentabilidad por plato",
  "Casos reales de restaurantes colombianos",
]

const contactCards = [
  {
    Icon: MapPin,
    title: "Dirección",
    value: "Bogotá, Colombia",
    detail: "Envíos a todo el país",
  },
  {
    Icon: Clock,
    title: "Horario de atención",
    value: "Lun – Vie · 8am – 6pm",
    detail: "Hora Colombia (UTC−5)",
  },
  {
    Icon: Mail,
    title: "Correo electrónico",
    value: "libro@cosayb.co",
    detail: "Respuesta en menos de 24 h",
  },
  {
    Icon: Phone,
    title: "WhatsApp",
    value: "+57 300 123 4567",
    detail: "También por notas de voz",
  },
]

export default function LibroPage() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    ciudad: "",
    tipo: "Digital",
    comentarios: "",
  })
  const [sent, setSent] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: connect to purchase API
    setSent(true)
  }

  return (
    <div className="page-transition">

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

            <h1
              className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up-delay-1"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
            >
              Costos de Alimentos
              <br />
              <span className="text-[#7AAEFF]">&amp; Bebidas</span>
            </h1>

            <p className="font-body text-lg text-[#8FA0BC] leading-relaxed mb-10 max-w-xl animate-fade-up-delay-2">
              La guía práctica para controlar costos, optimizar inventarios y aumentar
              la rentabilidad de restaurantes.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
              <a href="#comprar" className="btn-spx btn-spx-accent">
                Comprar libro
                <ArrowRight size={16} className="btn-arrow" />
              </a>
              <a href="#about" className="btn-spx btn-spx-light">
                Ver muestra
                <ArrowRight size={16} className="btn-arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT (two-column) ──────────────────────────────────── */}
      <section id="about" className="bg-[#F5F0E8] py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left — Book cover */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-2xl opacity-20"
                  style={{ background: "linear-gradient(135deg, #1B4FD8 0%, #12213A 100%)" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/libro-costos.webp"
                  alt="Portada del libro Costos de Alimentos y Bebidas"
                  className="relative rounded-xl shadow-2xl max-w-xs w-full"
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
                Contenido del libro
              </span>

              <h2
                className="font-display font-extrabold text-[#12213A] mb-6"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
              >
                Todo lo que necesitas
                <br />
                para ser rentable
              </h2>

              <p className="font-body text-base text-[#4A4438] leading-relaxed mb-8">
                Este libro nació de más de una década de capacitaciones en cocinas colombianas.
                Combina teoría sólida con casos reales para que entiendas los costos desde adentro
                y tomes decisiones con números, no con intuición.
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
                  de contenido práctico diseñado exclusivamente para restaurantes y
                  cocinas profesionales en Colombia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PURCHASE FORM ──────────────────────────────────────── */}
      <section id="comprar" className="bg-[#EDE7DB] py-24 sm:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-body font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full mb-6 text-[#1434A4]"
              style={{ background: "#DEEAFF" }}
            >
              Comprar
            </span>
            <h2
              className="font-display font-extrabold text-[#12213A]"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              Solicita tu ejemplar
            </h2>
            <p className="font-body text-base text-[#4A4438] mt-4 max-w-lg mx-auto">
              Completa el formulario y nos pondremos en contacto contigo para coordinar
              el pago y el envío.
            </p>
          </div>

          {sent ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <CheckCircle size={48} className="text-[#1B4FD8] mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl text-[#12213A] mb-3">
                ¡Solicitud recibida!
              </h3>
              <p className="font-body text-sm text-[#4A4438]">
                Nos comunicaremos contigo en las próximas 24 horas para confirmar
                tu pedido y los detalles de pago.
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

              {/* Tipo de libro */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tipo" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                  Tipo de libro *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  required
                  value={form.tipo}
                  onChange={handleChange}
                  className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none appearance-none"
                  style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                >
                  <option value="Digital">Digital (PDF)</option>
                  <option value="Físico">Físico (envío a domicilio)</option>
                  <option value="Ambos">Ambos (Digital + Físico)</option>
                </select>
              </div>

              {/* Comentarios */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="comentarios" className="font-body text-xs font-semibold text-[#12213A] uppercase tracking-wide">
                  Comentarios adicionales
                </label>
                <textarea
                  id="comentarios"
                  name="comentarios"
                  rows={4}
                  value={form.comentarios}
                  onChange={handleChange}
                  placeholder="Pedidos especiales, preguntas sobre el contenido, etc."
                  className="font-body text-sm text-[#12213A] px-4 py-3 rounded-lg outline-none resize-none"
                  style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                />
              </div>

              <button
                type="submit"
                className="btn-spx btn-spx-accent self-start"
              >
                Comprar libro
                <ArrowRight size={16} className="btn-arrow" />
              </button>

              <p className="font-body text-xs text-[#7A6E60]">
                * Campos obligatorios. Nos contactaremos contigo en menos de 24 horas hábiles.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── CONTACT CARDS ───────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-20 sm:py-28 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-display font-extrabold text-[#12213A]"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}
            >
              ¿Tienes dudas antes de comprar?
            </h2>
            <p className="font-body text-base text-[#4A4438] mt-4">
              Escríbenos directamente. Con gusto te orientamos.
            </p>
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

          {/* CTA bar */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contacto" className="btn-spx btn-spx-dark">
              Ir a Contacto
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
            <Link href="/" className="btn-spx btn-spx-accent">
              Conocer CO$AYB
              <ArrowRight size={16} className="btn-arrow" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

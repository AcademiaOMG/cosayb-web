"use client"

import { useState } from "react"
import { Search, ArrowRight } from "lucide-react"

const articles = [
  {
    id: 1,
    title: "El Ingrediente Oculto que Define la Rentabilidad en tu Cocina: ¡Los Costos!",
    excerpt: "La gestión adecuada de los costos de alimentos es uno de los pilares fundamentales para el éxito de cualquier negocio gastronómico. Muchos chefs y propietarios se enfocan en la calidad del plato y la presentación, pero olvidan que sin un control preciso de costos, incluso los restaurantes más populares pueden estar perdiendo dinero.",
    tags: ["NEWS", "USEFUL"],
    date: "Agosto 18, 2024",
    image: "/images/fondo-principal.webp",
    slug: "#",
  },
  {
    id: 2,
    title: "Costos Claros, Precios Justos: La Clave para Cocinas Rentables y Comensales Felices",
    excerpt: "Conocer a profundidad los costos de cada preparación es uno de los factores más determinantes para el éxito financiero de un restaurante. Cuando un chef o propietario domina sus números, puede fijar precios justos que reflejen el valor real del plato sin perder competitividad.",
    tags: ["NEWS", "USEFUL"],
    date: "Agosto 18, 2024",
    image: "/images/imagen-hero-capacitacion.webp",
    slug: "#",
  },
  {
    id: 3,
    title: "Comprar con Inteligencia: Por Qué Conocer los Costos es la Clave del Éxito en tu Cocina Profesional",
    excerpt: "En cualquier operación gastronómica, desde un pequeño café hasta una gran cocina industrial, el proceso de compra de ingredientes representa una de las inversiones más significativas. Saber cuánto cuesta realmente cada ingrediente no solo optimiza el presupuesto, sino que mejora la calidad del producto final.",
    tags: ["NEWS", "USEFUL"],
    date: "Agosto 18, 2024",
    image: "/images/cerca-de-chef-cocinando-en-la-cocina-del-restaurante-scaled.webp",
    slug: "#",
  },
  {
    id: 4,
    title: "Por Qué el Factor de Rendimiento Decide tu Rentabilidad: El Secreto del Precio Perfecto",
    excerpt: "Conocer el Factor de Rendimiento (FR) de los ingredientes es uno de los pasos más importantes en la gestión de costos gastronómicos. El FR representa la cantidad de producto utilizable después del proceso de limpieza, pelado o transformación, y determina el costo real por gramo de cada ingrediente.",
    tags: ["NEWS", "USEFUL"],
    date: "Agosto 18, 2024",
    image: "/images/cocinera-en-la-cocina-usando-un-dispositivo-portatil-scaled.webp",
    slug: "#",
  },
]

export default function BlogPage() {
  const [search, setSearch] = useState("")
  const [visibleCount, setVisibleCount] = useState(4)

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase())
  )

  const visible = filtered.slice(0, visibleCount)

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[50vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/fondo-principal.webp"
          alt="Blog Academia OMG"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0A1520]/60" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A1520] to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-end min-h-[50vh] pb-16">
          <h1
            className="font-display font-extrabold text-[#F5F0E8] leading-[0.95] tracking-tight mb-6 animate-fade-up"
            style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
          >
            Blog
          </h1>
        </div>
      </section>

      {/* ─── CONTENT ──────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] py-10 sm:py-16 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_300px] gap-12">
            {/* Articles */}
            <div>
              {/* Search */}
              <div className="mb-10">
                <div className="relative max-w-md">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6E60]" />
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="font-body text-sm w-full pl-11 pr-4 py-3 rounded-lg outline-none"
                    style={{ border: "1px solid #DDD6C8", background: "#FDFAF6" }}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="grid sm:grid-cols-2 gap-8">
                {visible.map((article) => (
                  <article
                    key={article.id}
                    className="card-hover bg-white border border-[#DDD6C8] rounded-2xl overflow-hidden flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Tags + Date */}
                      <div className="flex items-center gap-2 mb-3">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#12213A] text-white uppercase tracking-wider"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="font-body text-xs text-[#7A6E60]">/ {article.date}</span>
                      </div>

                      {/* Title */}
                      <h2 className="font-body font-bold text-[#12213A] text-base leading-snug mb-3">
                        {article.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="font-body text-sm text-[#4A4438] leading-relaxed flex-1 mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>

                      {/* Read more */}
                      <a
                        href={article.slug}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4FD8] hover:underline"
                      >
                        Read More
                        <ArrowRight size={12} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>

              {/* Load more */}
              {visibleCount < filtered.length && (
                <div className="mt-10 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="btn-spx btn-spx-dark"
                  >
                    Cargar más
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-8">
              <div>
                <h3 className="font-body font-bold text-[#12213A] text-sm uppercase tracking-wide mb-4">
                  Posts
                </h3>
              </div>

              {/* Quote card */}
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "linear-gradient(135deg, #12213A 0%, #1B4FD8 100%)" }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mx-auto mb-4 opacity-40"
                >
                  <path
                    d="M10 11H6C6 7.686 8.686 5 12 5V3C7.582 3 4 6.582 4 11v7h8v-7zm10 0h-4c0-3.314 2.686-6 6-6V3c-4.418 0-8 3.582-8 8v7h8v-7z"
                    fill="white"
                  />
                </svg>
                <blockquote className="font-display font-extrabold text-white text-xl leading-tight mb-4">
                  &ldquo;Sin números claros, no hay cocina rentable&rdquo;
                </blockquote>
                <p className="font-body text-sm text-[#8FA0BC]">Academia OMG</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

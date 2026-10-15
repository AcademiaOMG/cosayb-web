"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { FAQ, FAQ_CATEGORIES, filterFaq, type FaqCategoryId } from "@/lib/help/faq"

/** FAQ buscable por texto y categoría (centro de ayuda público). */
export default function HelpCenter({ supportHref = "/contacto" }: { supportHref?: string }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<FaqCategoryId | "all">("all")
  const results = useMemo(() => filterFaq(query, category), [query, category])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search size={18} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6E60]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una pregunta, por ejemplo «cancelar» o «factura»"
            aria-label="Buscar en el centro de ayuda"
            className="w-full rounded-xl border border-[#DDD6C8] bg-white py-3 pl-11 pr-4 text-sm text-[#12213A] outline-none focus:border-[#1B4FD8]"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
          {[{ id: "all" as const, label: "Todas" }, ...FAQ_CATEGORIES].map((c) => {
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.id)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "#1B4FD8" : "#fff",
                  color: active ? "#fff" : "#4A4438",
                  border: `1px solid ${active ? "#1B4FD8" : "#DDD6C8"}`,
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-sm text-[#7A6E60]" role="status" aria-live="polite">
        {results.length === FAQ.length && !query && category === "all"
          ? `${FAQ.length} respuestas`
          : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DDD6C8] bg-white px-6 py-12 text-center">
          <p className="font-semibold text-[#12213A]">No encontramos respuestas para tu búsqueda</p>
          <p className="mt-1 text-sm text-[#4A4438]">
            Prueba con otras palabras o <Link href={supportHref} className="font-semibold text-[#1B4FD8] underline">escríbenos</Link>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((e) => (
            <details key={e.id} id={e.id} className="group rounded-2xl border border-[#DDD6C8] bg-white px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#12213A]">
                {e.q}
                <span aria-hidden="true" className="text-[#1B4FD8] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#4A4438]">{e.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

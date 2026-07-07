"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Search, Store, MapPin, Scale, DollarSign } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const PAGE_SIZE = 50

interface PriceRow {
  id: string
  ingredientName: string
  originalName: string
  pricePerKg: string
  pricePerGram: string
  unitType: string
  city: string
  source: string
  category: string | null
  fetchedAt: string
}

const CITY_LABEL: Record<string, string> = {
  bogota: "Bogotá",
  medellin: "Medellín",
  cali: "Cali",
  barranquilla: "Barranquilla",
  cartagena: "Cartagena",
}

const SOURCE_LABEL: Record<string, string> = {
  exito: "Éxito",
  makro: "Makro",
  sipsa: "SIPSA",
}

const SOURCE_VARIANT: Record<string, "accent" | "success" | "muted"> = {
  exito: "accent",
  makro: "success",
  sipsa: "muted",
}

function formatCOP(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function PriceDetailModal({ row, onClose }: { row: PriceRow | null; onClose: () => void }) {
  if (!row) return null
  const pricePerKg = parseFloat(row.pricePerKg)
  const pricePerGram = parseFloat(row.pricePerGram)

  return (
    <Modal open={!!row} onClose={onClose} title={row.originalName}>
      <div className="flex flex-col gap-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={SOURCE_VARIANT[row.source] ?? "muted"}>
            {SOURCE_LABEL[row.source] ?? row.source}
          </Badge>
          <Badge variant="muted">{CITY_LABEL[row.city] ?? row.city}</Badge>
          {row.category && <Badge variant="muted">{row.category}</Badge>}
        </div>

        {/* Precio destacado */}
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: "var(--accent-light)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>
              Precio por kg
            </span>
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--accent-text)" }}>
              {formatCOP(pricePerKg)}
              <span className="text-sm font-normal ml-1">/kg</span>
            </span>
          </div>
          <DollarSign size={28} style={{ color: "var(--accent-text)", opacity: 0.4 }} />
        </div>

        {/* Filas */}
        {[
          { icon: <DollarSign size={15} />, label: "Precio por gramo", value: `$${pricePerGram.toFixed(4)}/g`, mono: true },
          { icon: <Scale size={15} />, label: "Tipo de unidad", value: row.unitType },
          { icon: <Store size={15} />, label: "Supermercado", value: SOURCE_LABEL[row.source] ?? row.source },
          { icon: <MapPin size={15} />, label: "Ciudad", value: CITY_LABEL[row.city] ?? row.city },
          { icon: <Search size={15} />, label: "Nombre interno", value: row.ingredientName },
          { icon: <Scale size={15} />, label: "Actualizado el", value: formatDate(row.fetchedAt) },
        ].map(({ icon, label, value, mono }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-3"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2.5" style={{ color: "var(--text-muted)" }}>
              {icon}
              <span className="text-sm">{label}</span>
            </div>
            <span
              className={`text-sm font-semibold text-right ${mono ? "font-mono" : ""}`}
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PreciosMercadoPage() {
  useHelpAvailable()
  const { hasFeature, featureLockedMessage } = usePermissions()
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("")
  const [source, setSource] = useState("")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<PriceRow | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(page * PAGE_SIZE),
    ...(search && { q: search }),
    ...(city && { city }),
    ...(source && { source }),
  })

  const { data, isLoading } = useSWR<{ data: PriceRow[] }>(
    `precios-mercado?${params}`,
    () => fetch(`${API}/api/v1/precios-mercado?${params}`, { credentials: "include" })
      .then((r) => r.json()),
    { keepPreviousData: true }
  )

  const rows = data?.data ?? []
  const hasMore = rows.length === PAGE_SIZE

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    setPage(0)
  }

  function handleFilter(key: "city" | "source", value: string) {
    if (key === "city") setCity(value)
    else setSource(value)
    setPage(0)
  }

  function goToPage(n: number) {
    setPage(n)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!hasFeature("module_marketPrices")) {
    return <ModuleLocked message={featureLockedMessage("module_marketPrices")} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Precios de mercado"
        subtitle="Datos sincronizados de Éxito y Makro — actualizados diariamente"
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="search"
            placeholder="Buscar ingrediente…"
            value={search}
            onChange={handleSearch}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Supermercado */}
        <select
          value={source}
          onChange={(e) => handleFilter("source", e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            color: source ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          <option value="">Todos los supermercados</option>
          <option value="exito">Éxito</option>
          <option value="makro">Makro</option>
        </select>

        {/* Ciudad */}
        <select
          value={city}
          onChange={(e) => handleFilter("city", e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            color: city ? "var(--text-primary)" : "var(--text-muted)",
          }}
        >
          <option value="">Todas las ciudades</option>
          <option value="bogota">Bogotá</option>
          <option value="medellin">Medellín</option>
          <option value="cali">Cali</option>
          <option value="barranquilla">Barranquilla</option>
          <option value="cartagena">Cartagena</option>
        </select>
      </div>

      {/* Tabla */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border-light)", background: "var(--bg-surface)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)", background: "var(--bg-primary)" }}>
                {["Nombre del producto", "Supermercado", "Ciudad", "Precio/kg", "Precio/g"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="h-4 rounded-md animate-pulse"
                            style={{ background: "var(--bg-secondary)", width: j === 0 ? "70%" : "50%" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--border-light)" }}
                      onClick={() => setSelected(row)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <span className="block truncate font-medium" style={{ color: "var(--text-primary)" }}>
                          {row.originalName}
                        </span>
                        <span className="block text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {row.ingredientName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={SOURCE_VARIANT[row.source] ?? "muted"}>
                          {SOURCE_LABEL[row.source] ?? row.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                        {CITY_LABEL[row.city] ?? row.city}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
                        {formatCOP(row.pricePerKg)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        ${parseFloat(row.pricePerGram).toFixed(4)}
                      </td>
                    </tr>
                  ))}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No se encontraron resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {(page > 0 || hasMore) && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: "1px solid var(--border-light)" }}
          >
            <button
              onClick={() => goToPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
            >
              ← Anterior
            </button>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Página {page + 1}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
              style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      <PriceDetailModal row={selected} onClose={() => setSelected(null)} />

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Precios de Mercado"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion muestra precios actualizados de ingredientes en supermercados colombianos.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Buscar ingredientes:</strong> Usa la barra de busqueda para encontrar productos especificos.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Filtrar por supermercado:</strong> Selecciona Exito o Makro para ver precios de una tienda.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Filtrar por ciudad:</strong> Elige tu ciudad para ver precios locales.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Ver detalles:</strong> Haz clic en un producto para ver precio por kg, precio por gramo y mas informacion.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Precios por gramo:</strong> Util para calcular costos de recetas que usan gramos.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> Los precios se actualizan diariamente. La informacion proviene de fuentes publicas de supermercados.
          </p>
        </div>
      </Modal>
    </div>
  )
}

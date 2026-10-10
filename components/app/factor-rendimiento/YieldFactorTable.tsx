"use client"

import type { FactorRendimiento } from "@/types/domain"
import { ChevronRight, Eye, Pencil, Trash2 } from "lucide-react"

const money = (n: number) => `$ ${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const grams = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })} g`
const pct = (n: number) => `${(n * 100).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`

/** Mismas palabras que el filtro de la lista */
const VARIANT_LABEL: Record<string, string> = { bfactor: "Proteína", bfactorveg: "Vegetal" }

/** Columnas en escritorio, compartidas por la cabecera y las filas para que queden alineadas. */
const COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_6rem_6rem_6rem_8.5rem_7.5rem_6.5rem] xl:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem_10rem_9rem_7rem]"

interface YieldFactorTableProps {
  data: FactorRendimiento[]
  onView: (factor: FactorRendimiento) => void
  /** Sin permiso de editar/borrar no se pasa y el botón no aparece */
  onEdit?: (factor: FactorRendimiento) => void
  onDelete?: (factor: FactorRendimiento) => void
  /** Registro recién guardado: se resalta para que el usuario lo encuentre */
  highlightId?: string
}

const ICON_BTN =
  "pointer-events-auto relative z-10 p-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"

/** Barra de rendimiento: cuánto de lo que se compra se aprovecha */
function YieldBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value * 100))
  return (
    <span
      aria-hidden="true"
      className="block h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--bg-secondary)" }}
    >
      <span className="block h-full rounded-full" style={{ width: `${width}%`, background: "var(--accent)" }} />
    </span>
  )
}

function Header() {
  const cell = "text-xs font-semibold"
  return (
    <div
      className={`hidden items-center gap-4 px-5 py-3 md:grid ${COLUMNS}`}
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-hidden="true"
    >
      <span className={cell}>Ingrediente</span>
      <span className={cell}>Tipo</span>
      <span className={`${cell} text-right`}>Compras</span>
      <span className={`${cell} text-right`}>Útil</span>
      <span className={cell}>Rendimiento</span>
      <span className={`${cell} text-right`} style={{ color: "var(--text-secondary)" }}>
        Costo real por gramo
      </span>
      <span />
    </div>
  )
}

function Row({
  item,
  highlighted,
  onView,
  onEdit,
  onDelete,
}: { item: FactorRendimiento; highlighted: boolean } & Pick<YieldFactorTableProps, "onView" | "onEdit" | "onDelete">) {
  const yieldValue = parseFloat(item.yieldFactor)
  const bought = grams(parseFloat(item.totalWeightGrams))
  const useful = grams(parseFloat(item.netWeightGrams))
  const costPerGram = money(parseFloat(item.realCostPerGram))
  const type = VARIANT_LABEL[item.variant] ?? item.variant

  return (
    <li
      data-factor-id={item.id}
      className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50"
      style={highlighted ? { background: "var(--accent-light)" } : undefined}
    >
      {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
      <button
        type="button"
        onClick={() => onView(item)}
        className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        aria-label={`Ver detalles de ${item.ingredientName}`}
      />

      {/* ── Móvil: dos líneas, el rendimiento y el costo mandan ──────────── */}
      <div className="pointer-events-none relative flex items-center gap-3 px-4 py-3 md:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {item.ingredientName}
          </span>
          <span className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            {type} · compras {bought} → útil {useful}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end tabular-nums">
          <span className="text-[15px] font-bold" style={{ color: "var(--accent-text)" }}>
            {pct(yieldValue)}
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {costPerGram} /g
          </span>
        </div>
        <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--border-medium)" }} />
      </div>

      {/* ── Escritorio: columnas alineadas, números a la derecha ─────────── */}
      <div className={`pointer-events-none relative hidden items-center gap-4 px-5 md:grid ${COLUMNS}`} style={{ minHeight: 56 }}>
        <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={item.ingredientName}>
          {item.ingredientName}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {type}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {bought}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {useful}
        </span>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>
            {pct(yieldValue)}
          </span>
          <YieldBar value={yieldValue} />
        </div>
        <span className="text-right text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {costPerGram}
        </span>
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => onView(item)}
            title="Ver el cálculo completo"
            aria-label={`Ver detalles de ${item.ingredientName}`}
            className={ICON_BTN}
            style={{ color: "var(--text-muted)" }}
          >
            <Eye size={16} />
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              title="Editar"
              aria-label={`Editar ${item.ingredientName}`}
              className={ICON_BTN}
              style={{ color: "var(--text-muted)" }}
            >
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              title="Eliminar"
              aria-label={`Eliminar ${item.ingredientName}`}
              className={`${ICON_BTN} hover:!bg-red-50`}
              style={{ color: "#B42020" }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export default function YieldFactorTable({ data, onView, onEdit, onDelete, highlightId }: YieldFactorTableProps) {
  if (data.length === 0) return null

  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <Header />
      <ul aria-label="Factores de rendimiento guardados">
        {data.map((item) => (
          <Row
            key={item.id}
            item={item}
            highlighted={item.id === highlightId}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  )
}

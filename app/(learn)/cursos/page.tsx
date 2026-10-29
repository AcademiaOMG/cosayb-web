"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, SearchX, X } from "lucide-react"
import { useCatalog } from "@/lib/lms/hooks"
import { LEVEL_LABEL } from "@/lib/lms/format"
import type { CourseLevel } from "@/lib/lms/types"
import Cover from "@/components/lms/art/Cover"
import { CardSkeletonGrid, CourseCard, CourseRow } from "@/components/lms/parts"
import { Button, Chip, EmptyState, ErrorPanel, PageHeader } from "@/components/lms/ui"

type Sort = "new" | "popular" | "short" | "az"
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Más recientes" },
  { id: "popular", label: "Más populares" },
  { id: "short", label: "Más cortos" },
  { id: "az", label: "A–Z" },
]

function Catalog() {
  const params = useSearchParams()
  const router = useRouter()
  const { data, error, mutate } = useCatalog()
  const q = (params.get("q") ?? "").trim()
  const [cat, setCat] = useState<string | null>(null)
  const [level, setLevel] = useState<CourseLevel | null>(null)
  const [sort, setSort] = useState<Sort>("new")
  const [view, setView] = useState<"grid" | "list">("grid")

  const categories = useMemo(() => [...new Set((data ?? []).map((c) => c.category))].sort(), [data])
  const list = useMemo(() => {
    const needle = q.toLowerCase()
    const out = (data ?? []).filter(
      (c) =>
        (!cat || c.category === cat) &&
        (!level || c.level === level) &&
        (!needle || `${c.title} ${c.description} ${c.tags.join(" ")} ${c.category}`.toLowerCase().includes(needle))
    )
    out.sort((a, b) =>
      sort === "popular" ? b.enrolledCount - a.enrolledCount : sort === "short" ? (a.durationMinutes || 9e9) - (b.durationMinutes || 9e9) : sort === "az" ? a.title.localeCompare(b.title, "es") : +new Date(b.createdAt) - +new Date(a.createdAt)
    )
    return out
  }, [data, q, cat, level, sort])

  const filtered = Boolean(q || cat || level)
  const reset = () => {
    setCat(null)
    setLevel(null)
    if (q) router.push("/cursos")
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Catálogo de cursos" subtitle="Costeo, operación y finanzas para cocinas, panaderías y restaurantes." />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros por categoría">
          <Chip pressed={cat === null} onClick={() => setCat(null)}>Todas</Chip>
          {categories.map((c) => <Chip key={c} pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>{c}</Chip>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros por nivel">
            {(Object.keys(LEVEL_LABEL) as CourseLevel[]).map((l) => <Chip key={l} pressed={level === l} onClick={() => setLevel(level === l ? null : l)}>{LEVEL_LABEL[l]}</Chip>)}
          </div>
          {q && (
            <button type="button" className="l-chip" aria-pressed="true" onClick={() => router.push("/cursos")}>
              Búsqueda: {q} <X size={14} aria-hidden="true" /><span className="sr-only">Quitar búsqueda</span>
            </button>
          )}
          {filtered && <button type="button" className="text-sm font-bold" style={{ color: "var(--l-brand)" }} onClick={reset}>Restablecer</button>}
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="sort">Ordenar por</label>
            <select id="sort" className="l-input !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="l-seg" role="tablist" aria-label="Vista">
              <button type="button" role="tab" aria-selected={view === "grid"} aria-label="Vista de cuadrícula" onClick={() => setView("grid")}><LayoutGrid size={16} aria-hidden="true" /></button>
              <button type="button" role="tab" aria-selected={view === "list"} aria-label="Vista de lista" onClick={() => setView("list")}><List size={16} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
        {data && <p className="text-sm font-bold" style={{ color: "var(--l-muted)" }} aria-live="polite">{list.length} {list.length === 1 ? "curso" : "cursos"}</p>}
      </div>

      {error ? (
        <ErrorPanel title="No pudimos cargar el catálogo" onRetry={() => mutate()} />
      ) : !data ? (
        <CardSkeletonGrid />
      ) : list.length === 0 ? (
        <EmptyState
          art={<span className="block w-56 overflow-hidden rounded-3xl"><Cover coverKey="cocina" className="block h-auto w-full" /></span>}
          title={filtered ? "No encontramos cursos con esos filtros" : "Pronto habrá cursos aquí"}
          description={filtered ? "Prueba con otra búsqueda o quita algún filtro." : "Estamos preparando el contenido. Vuelve en unos días."}
          action={filtered ? <Button variant="soft" onClick={reset}><SearchX size={16} aria-hidden="true" /> Quitar filtros</Button> : undefined}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map((c, i) => <CourseCard key={c.id} c={c} index={i % 9} />)}</div>
      ) : (
        <div className="flex flex-col gap-3">{list.map((c, i) => <CourseRow key={c.id} c={c} index={i % 9} />)}</div>
      )}
    </div>
  )
}

export default function CursosPage() {
  return (
    <Suspense fallback={<CardSkeletonGrid />}>
      <Catalog />
    </Suspense>
  )
}

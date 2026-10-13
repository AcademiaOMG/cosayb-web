import { RecipeTableSkeleton } from "@/components/app/recipes/RecipeTable"

/**
 * Esqueleto de la ruta: reproduce la página real (cabecera con título y botón,
 * barra de búsqueda + filtros y la tabla de recetas) con las mismas medidas.
 */
export default function RecetasLoading() {
  const fill = { background: "var(--bg-secondary)" }
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-9 w-40 animate-pulse rounded-lg" style={fill} />
          <div className="h-4 w-56 animate-pulse rounded-md" style={fill} />
        </div>
        <div className="h-10 w-36 shrink-0 animate-pulse rounded-xl" style={fill} />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-10 min-w-0 flex-1 animate-pulse rounded-xl" style={fill} />
        <div className="h-10 w-11 shrink-0 animate-pulse rounded-xl" style={fill} />
      </div>
      <RecipeTableSkeleton />
    </div>
  )
}

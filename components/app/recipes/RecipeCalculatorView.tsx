"use client"

import { useEffect, useState } from "react"
import "./recipe-tape.css"
import useSWR from "swr"
import { AlertCircle } from "lucide-react"
import Button from "@/components/ui/Button"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { CalcViewShell } from "@/components/calculator"
import RecipeCalculator, { type RecipeSavedInfo } from "./RecipeCalculator"
import { TENANT_SOURCE, type RecipeFormDataSource } from "./recipeSource"

/**
 * Vista completa para crear o editar una receta (misma idea que Punto de
 * equilibrio y Factor de rendimiento): carga el catálogo y la receta a editar,
 * y monta el asistente dentro del esqueleto común con "← volver".
 * Al montarse arranca limpia; quien la usa debe darle un `key` por receta.
 */
/** Tamaño de diseño de la ventana en escritorio (px); se escala para caber en pantalla */
const PANEL_W = 1040
const PANEL_H = 666

export default function RecipeCalculatorView({
  editRecipeId,
  dataSource = TENANT_SOURCE,
  backLabel = "Mis recetas",
  onBack,
  onSaved,
}: {
  editRecipeId?: string | null
  dataSource?: RecipeFormDataSource
  backLabel?: string
  onBack: () => void
  /** La receta ya se guardó: quien usa la vista refresca su lista y vuelve a ella */
  onSaved: (info: RecipeSavedInfo) => void
}) {
  const [dirty, setDirty] = useState(false)

  // Si se cierra la pestaña o se recarga con la receta a medias, el navegador avisa
  useEffect(() => {
    if (!dirty) return
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Ventana flotante: en escritorio se escala el tamaño de diseño para que siempre quepa entera
  const [vp, setVp] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const measure = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    measure()
    window.addEventListener("resize", measure)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("resize", measure)
      document.body.style.overflow = prevOverflow
    }
  }, [])
  const fit = !!vp && vp.w >= 900 && vp.h >= 520
  const scale = vp ? Math.min(1.15, (vp.h - 32) / PANEL_H, (vp.w - 32) / PANEL_W) : 1

  const catalog = useSWR(["recipes-catalog", dataSource.sourceKey], () => dataSource.loadCatalog(), {
    revalidateOnFocus: false,
  })
  const recipe = useSWR(
    editRecipeId ? ["recipe-edit", dataSource.sourceKey, editRecipeId] : null,
    () => dataSource.loadRecipe(editRecipeId!),
    // Siempre fresca al abrir; sin revalidaciones después (remontaría la calculadora y perdería lo escrito)
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateOnMount: true, dedupingInterval: 0 },
  )

  const failed = (!catalog.data && catalog.error) || (editRecipeId && !recipe.data && recipe.error)
  const ready = !!catalog.data && (!editRecipeId || (!!recipe.data && !recipe.isValidating))

  return (
    <div className="rv-overlay" role="dialog" aria-modal="true" aria-label={editRecipeId ? "Editar receta" : "Nueva receta"}>
      <div
        className={`rv-panel ${fit ? "is-fit" : "is-sheet"}`}
        style={fit ? ({ "--rv-scale": scale } as React.CSSProperties) : undefined}
      >
        <div className="rv-rise">
    <CalcViewShell
      title={editRecipeId ? "Editar receta" : "Nueva receta"}
      backLabel={backLabel}
      onBack={onBack}
      dirty={dirty}
      asModal
    >
      {failed ? (
        <div
          role="alert"
          className="flex items-center gap-2 p-4 rounded-xl text-sm"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B42020" }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">
            No se pudo cargar la información de la receta. Revisa tu conexión e inténtalo de nuevo.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void catalog.mutate()
              void recipe.mutate()
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : !ready ? (
        <div role="status" aria-label="Cargando" style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingSpinner size={32} />
        </div>
      ) : (
        <RecipeCalculator
          catalog={catalog.data!}
          editRecipe={editRecipeId ? recipe.data : null}
          dataSource={dataSource}
          onSaved={onSaved}
          onDirtyChange={setDirty}
        />
      )}
    </CalcViewShell>
        </div>
      </div>
    </div>
  )
}

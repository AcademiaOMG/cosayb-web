"use client"

import { useEffect, useState } from "react"
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
    <CalcViewShell
      title={editRecipeId ? "Editar receta" : "Nueva receta"}
      subtitle="Te guiamos paso a paso: nombre, ingredientes, porciones y precio."
      backLabel={backLabel}
      onBack={onBack}
      dirty={dirty}
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
  )
}

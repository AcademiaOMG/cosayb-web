import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import RecipePickerModal from "@/components/app/recipes/RecipePickerModal"
import type { Recipe } from "@/types/domain"

function makeRecipe(patch: Partial<Recipe>): Recipe {
  return {
    id: "3f1b7a2e-0000-4000-8000-000000000021",
    organizationId: "3f1b7a2e-0000-4000-8000-000000000010",
    name: "Arroz con pollo",
    recipeNumber: "R-01",
    servings: "4",
    servingWeightG: "480",
    safetyMargin: "3.00",
    isBase: false,
    isPublic: false,
    createdAt: "2026-05-01T12:00:00Z",
    updatedAt: "2026-05-01T12:00:00Z",
    ...patch,
  }
}

describe("Selector de platos del menú (lista de recetas)", () => {
  it("muestra la lista de recetas con sus tarjetas", () => {
    const html = renderToString(
      <RecipePickerModal
        open
        recipes={[makeRecipe({}), makeRecipe({ id: "3f1b7a2e-0000-4000-8000-000000000022", name: "Salsa tártara", isBase: true })]}
        onClose={() => {}}
        onSelect={() => {}}
      />,
    )

    expect(html).toContain("Agregar plato")
    expect(html).toContain("Arroz con pollo")
    expect(html).toContain("Salsa tártara")
  })

  it("muestra un estado vacío cuando no hay recetas", () => {
    const html = renderToString(
      <RecipePickerModal open recipes={[]} onClose={() => {}} onSelect={() => {}} />,
    )

    expect(html).toContain("Aún no tienes recetas")
  })
})

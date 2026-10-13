import type { Recipe } from "@/types/domain"

/**
 * Propiedad REAL de una receta (espejo de recipes.ownership.ts en la API).
 *
 * Se puede editar/eliminar solo si pertenece a la organización activa y no es
 * del banco público. Las etiquetas de tipo (isBase = "preparación base") NO
 * bloquean nada: son el tipo de receta, no una marca de propiedad. La API
 * vuelve a validar (403/404), esto solo decide qué acciones se ofrecen.
 */
export function ownsRecipe(
  recipe: Pick<Recipe, "organizationId" | "isPublic"> | null | undefined,
  activeOrgId: string | null | undefined,
): boolean {
  if (!recipe || !activeOrgId) return false
  if (recipe.isPublic) return false
  return recipe.organizationId === activeOrgId
}

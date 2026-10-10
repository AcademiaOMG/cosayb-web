// ─── Vocabulario único de recetas ───────────────────────────────────────────
// Toda la app usa estas palabras (tablas, filtros, detalle, selector del menú),
// para que una receta se llame siempre igual en todos lados.
//
// Dos preguntas, dos vocabularios:
//   ¿Qué es?  → Plato (se vende)  |  Preparación base (se usa dentro de otras recetas)
//   ¿De quién? → Mis recetas (las del negocio)  |  Banco de recetas (las de Academia OMG)

export const RECIPE_TYPE = {
  /** Receta que se vende como un plato (en el código: isBase = false) */
  dish: {
    label: "Plato",
    plural: "Platos",
    hint: "Se vende al cliente",
  },
  /** Receta que se usa como ingrediente de otras (salsa, fondo, masa…) (isBase = true) */
  base: {
    label: "Preparación base",
    plural: "Preparaciones base",
    hint: "Se usa como ingrediente dentro de otras recetas (salsa, fondo, masa…)",
  },
} as const

export const RECIPE_ORIGIN = {
  own: {
    label: "Mis recetas",
    hint: "Las que creaste o copiaste a tu negocio",
  },
  banco: {
    label: "Banco de recetas",
    /** Etiqueta corta para una fila o tarjeta */
    tag: "Del banco",
    hint: "Recetas de Academia OMG para usar como punto de partida",
  },
} as const

export function recipeTypeLabel(isBase: boolean) {
  return isBase ? RECIPE_TYPE.base.label : RECIPE_TYPE.dish.label
}

/** Por qué no hay botón de eliminar en esta receta */
export const RECIPE_CANT_DELETE = {
  base: "Las preparaciones base no se pueden eliminar: otras recetas pueden estar usándolas.",
  banco: "Las recetas del banco no se pueden eliminar. Copia una a tu negocio para modificarla.",
} as const

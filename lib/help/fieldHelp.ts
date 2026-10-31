// Diccionario CENTRAL de ayudas de campo. Textos cortos, sin jerga, con ejemplo cuando ayuda.
// Se usan con <InfoTip help="clave" />. Una sola fuente: cambiar un texto aquí lo cambia en todas partes.

export interface FieldHelp {
  /** Qué es y para qué sirve, en una o dos frases */
  text: string
  /** Cómo diligenciarlo (opcional) */
  example?: string
}

export const FIELD_HELP = {
  // ── Recetas ──────────────────────────────────────────────────────────────
  "recipe.quantity": {
    text: "Cuánto de este ingrediente lleva la receta completa, en la unidad del ingrediente (gramos, unidades…).",
    example: "Harina: 500 g. Huevos: 30 und.",
  },
  "recipe.unit": {
    text: "Cómo se mide este ingrediente. Lo que se pesa va en gramos o kilos; lo que se cuenta (huevos, limones) va en unidades. No se mezclan.",
  },
  "recipe.servings": {
    text: "Cuántos platos o porciones salen con todo lo que agregaste. Con esto se calcula el costo de cada porción.",
    example: "Si la receta rinde para 4 personas, escribe 4.",
  },
  "recipe.servingWeight": {
    text: "Cuánto pesa una porción servida, en gramos. Si lo dejas vacío se calcula solo: peso total ÷ porciones.",
    example: "Un plato de 250 g.",
  },
  "recipe.margin": {
    text: "Porcentaje que se suma al costo para cubrir mermas y pequeños errores de medida (0 % a 5 %).",
    example: "3 % es un valor habitual.",
  },
  "recipe.pctMP": {
    text: "Qué parte del precio de venta quieres que sea costo de ingredientes (materia prima). Con esto se sugiere el precio.",
    example: "Si quieres que los ingredientes sean el 30 % del precio, escribe 30.",
  },
  "recipe.isBase": {
    text: "Una preparación base es una receta que luego puedes usar como ingrediente de otras (una salsa, una masa, un fondo).",
  },
  "recipe.number": {
    text: "Código interno para reconocer la receta. No se puede repetir en tu negocio.",
    example: "R-001",
  },
  "recipe.costUnit": {
    text: "Lo que cuesta una unidad de medida del ingrediente (1 gramo o 1 unidad), según el precio que registraste.",
  },

  // ── Ingredientes ─────────────────────────────────────────────────────────
  "ingredient.cost": {
    text: "Lo que pagaste por el paquete, bulto o bandeja completa.",
    example: "Bandeja de 30 huevos a $10.000 → escribe 10000.",
  },
  "ingredient.content": {
    text: "Cuánto trae ese paquete, en la unidad que elegiste. Con esto se calcula el costo de cada gramo o unidad.",
    example: "Bolsa de 1 kg → 1000 (gramos). Bandeja de 30 huevos → 30 (unidades).",
  },
  "ingredient.unit": {
    text: "Cómo usas este ingrediente en tus recetas: por peso (gramos) o por unidades. Una vez que está en recetas ya no se puede cambiar, para no alterar costos.",
    example: "Harina, azúcar, sal → gramos. Huevos, limones → unidades.",
  },

  // ── Menú ─────────────────────────────────────────────────────────────────
  "menu.people": {
    text: "Para cuántas personas es el menú. Con esto se calcula el costo total y la lista de compras.",
    example: "Un evento para 50 invitados → 50.",
  },
  "menu.gramsPerPortion": {
    text: "Cuántos gramos de esta receta come cada persona.",
    example: "200 g de arroz por persona.",
  },
  "menu.unitsPerPortion": {
    text: "Cuántas unidades de este producto consume cada persona.",
    example: "1 vaso o 2 servilletas por persona.",
  },

  // ── Punto de equilibrio ──────────────────────────────────────────────────
  "breakEven.fixedCosts": {
    text: "Lo que pagas cada mes aunque no vendas nada: arriendo, sueldos, servicios.",
    example: "Arriendo $2.000.000 + servicios $500.000.",
  },
  "breakEven.price": {
    text: "Precio al que vendes una unidad (un plato, una bebida) al cliente.",
  },
  "breakEven.variableCost": {
    text: "Lo que te cuesta producir esa unidad: ingredientes y empaque que cambian con cada venta.",
  },

  // ── Factor de rendimiento ────────────────────────────────────────────────
  "yield.totalCost": {
    text: "Lo que pagaste por todo el producto tal como lo compraste (con cáscara, hueso, grasa).",
  },
  "yield.totalWeight": {
    text: "Peso del producto completo antes de limpiarlo, en gramos.",
    example: "Pollo entero de 2 kg → 2000.",
  },
  "yield.waste": {
    text: "Peso de lo que se pierde al limpiar o cocinar: cáscaras, huesos, grasa, merma. Cada tipo de pérdida se escribe por separado.",
  },

  // ── Valoración ───────────────────────────────────────────────────────────
  "valuation.salePrice": {
    text: "Precio al que vendes el plato hoy.",
  },
  "valuation.cost": {
    text: "Lo que te cuestan los ingredientes de una porción de ese plato.",
  },
} as const satisfies Record<string, FieldHelp>

export type HelpKey = keyof typeof FIELD_HELP

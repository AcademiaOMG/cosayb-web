export type Plan = "free" | "pro" | "academia"

// Refleja exactamente el schema `ingredients` del backend (Drizzle ORM).
// Drizzle devuelve columnas `numeric` como string → costPerUnit, weightGrams, costPerGram son strings.
export interface Ingrediente {
  id: string
  name: string
  costPerUnit: string
  weightGrams: string
  costPerGram: string
  isPublic: boolean
  userId: string | null   // null = ingrediente del banco base público
  createdAt: string
  updatedAt: string
}

export interface YieldFactorWasteItem {
  id: string
  yieldFactorId: string
  name: string
  weightGrams: string
  allocatedCost: string
  sortOrder: number
}

export interface FactorRendimiento {
  id: string
  variant: "bfactor" | "bfactorveg"
  ingredientName: string
  totalCost: string
  totalWeightGrams: string
  costPerGram: string
  totalWasteGrams: string
  totalWasteCost: string
  netWeightGrams: string
  yieldFactor: string
  realCostPerGram: string
  organizationId: string
  wasteItems: YieldFactorWasteItem[]
  createdAt: string
  updatedAt: string
}


// ─── Recetas (nuevo schema backend Sprint 2) ────────────────────────────────

/** Componente de receta — ingrediente directo O sub-receta (patrón polimórfico) */
export interface RecipeItem {
  id: string
  recipeId: string
  componentType: 'ingredient' | 'recipe'
  ingredientId: string | null
  subRecipeId: string | null
  quantityG: string      // numeric → string (Drizzle)
  sortOrder: number
  ingredientName: string | null
  subRecipeName: string | null
}

/** Cabecera de receta + sus items */
export interface Recipe {
  id: string
  organizationId: string
  name: string
  recipeNumber: string
  servings: string         // numeric → string (Drizzle)
  servingWeightG: string | null
  safetyMargin: string     // numeric → string (Drizzle), default "3.00"
  isBase: boolean          // disponible como sub-receta en otras recetas
  isPublic: boolean        // receta del banco base público
  items: RecipeItem[]
  totalWeightG: number     // computed: suma de cantidades de items
  itemCount: number        // computed: cantidad de items
  createdAt: string
  updatedAt: string
}

// Refleja el schema real del backend recetas (Drizzle numeric → string)
export interface Receta {
  id: string
  organizationId: string
  nombre: string
  descripcion: string | null
  costoPorPorcion: string   // numeric string, ej: "617.4170"
  pesoTotalGramos: string   // numeric string, ej: "200.00"
  createdAt: string
  updatedAt: string
}


/** Una línea del desglose de costo (retornado por GET /recipes/:id/cost) */
export interface RecipeCostBreakdownItem {
  depth: number
  ingredientId: string
  ingredientName: string
  effectiveQuantityG: number
  costPerGram: number
  lineCost: number
}

/** Resultado completo del cálculo de costo */
export interface RecipeCostResult {
  recipeId: string
  name: string
  servings: number
  servingWeightG: number | null
  safetyMarginPct: number
  rawCostTotal: number
  rawCostPerServing: number
  costWithMarginTotal: number
  costWithMarginPerServing: number
  costPerGram: number | null
  circularRefs: boolean
  breakdown: RecipeCostBreakdownItem[]
  profitability: ProfitabilityAnalysis | null
}

/** Análisis de rentabilidad — fórmulas del Excel CO$AYB */
export interface ProfitabilityAnalysis {
  /** % de materia prima en el precio de venta (input, ej: 0.30 = 30%) */
  materialCostPct: number
  /** MUY_BUENO si <0.32, REGULAR si 0.32-0.37, MALO si >0.37 */
  materialCostRating: "MUY_BUENO" | "REGULAR" | "MALO"
  /** Costos fijos = (1 - %MP) / 1.8 */
  fixedCostPct: number
  /** Costo fijo en pesos = fixedCostPct × precioVentaPotencial */
  fixedCostAmount: number
  /** Precio potencial de venta = costWithMarginTotal / %MP */
  potentialSalePrice: number
  /** Ganancia = 1 - (%MP + %CostosFijos) */
  profitPct: number
  /** Ganancia en pesos = profitPct × precioVentaPotencial */
  profitAmount: number
}

export interface MenuReceta {
  id: string
  menuId: string
  recipeId: string
  cantidadGramos: string  // numeric string
  orden: number
}

// Resultado del cálculo de costo por receta (GET /:id/costo)
export interface RecetaLineaCosto {
  recipeId: string
  nombre: string
  cantidadGramos: number
  costoGramo: number
  costoPorcionEnMenu: number
  costoTotalEnMenu: number
}

export type MenuIndicator = "MUY_BUENO" | "REGULAR" | "MALO"

export interface CostoMenuResult {
  recetas: RecetaLineaCosto[]
  costoTotalPorcion: number
  costoTotalPersonas: number
  margenAplicadoPorcion: number
  costoConMargenPorcion: number
  costoConMargenPersonas: number
  precioPotencialVentaPorcion: number
  precioPotencialVentaTotal: number
  pctCostosFijos: number
  pctGanancia: number
  indicator: MenuIndicator
}

// Refleja el schema real del backend menus (Drizzle numeric → string)
export interface Menu {
  id: string
  organizationId: string
  nombre: string
  fecha: string            // YYYY-MM-DD
  numPersonas: number
  margenSeguridad: string  // numeric string
  pctMateriaPrima: string  // numeric string
  notas: string | null
  recetas: MenuReceta[]
  createdAt: string
  updatedAt: string
}

export interface Valoracion {
  id: string
  nombre: string
  menuId?: string
  menu?: Menu
  ventasTotales: number
  costoTotal: number
  utilidadBruta: number
  porcentajeUtilidad: number
  organizationId: string
  periodoInicio: string
  periodoFin: string
  createdAt: string
  updatedAt: string
}

// Tipo que refleja el schema real del backend (Drizzle numeric → string)
export type ValuationIndicator = "MUY BUENO" | "REGULAR" | "MALO"
export type ValuationRefType = "recipe" | "menu" | "standalone"

export interface Valuation {
  id: string
  userId: string
  name: string
  refId: string | null
  refType: ValuationRefType
  costMateriaprima: string
  safetyMargin: string
  pctMateriaprima: string
  pctFixedCosts: string
  pctProfit: string
  suggestedPrice: string
  actualPrice: string | null
  indicator: ValuationIndicator
  notes: string | null
  createdAt: string
}

// Ítem de costo fijo (refleja el campo JSONB del backend)
export interface FixedCostItem {
  name: string
  amount: number
}

// Registro persistido de Punto de Equilibrio (Drizzle numeric → string)
export interface BreakEvenRecord {
  id: string
  organizationId: string
  fixedCosts: FixedCostItem[]
  totalFixedCosts: number
  salePrice: number
  variableCost: number
  contributionMargin: number
  breakEvenUnits: number
  breakEvenRevenue: number
  createdAt: string
}

// Alias de compatibilidad (usado en lib/api.ts legacy)
export interface PuntoEquilibrio {
  id: string
  costosFijos: number
  costosVariables: number
  precioVentaPromedio: number
  unidadesNecesarias: number
  ingresosNecesarios: number
  organizationId: string
  calculadoEn: string
}

export interface Organization {
  id: string
  name: string
  businessType: string | null
  plan: Plan
  effectivePlan: Plan
  ownerId: string
  trialEndsAt: string | null
  isTrialing: boolean
  trialExpired: boolean
  daysLeft: number
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  nombre: string
  email: string
  avatarUrl?: string
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  organizationId: string
  plan: Plan
  status: "active" | "inactive" | "trialing" | "canceled"
  currentPeriodStart: string
  currentPeriodEnd: string
  createdAt: string
  updatedAt: string
}

// ─── Planes y Feature Flags ──────────────────────────────────────────────────

export interface PlanFeature {
  key: string
  label: string
}

export interface PlanInfo {
  id: Plan
  name: string
  price: number
  priceLabel: string
  description: string
  features: PlanFeature[]
}

export interface CurrentPlanData {
  plan: Plan
  effectivePlan: Plan
  isTrialing: boolean
  trialExpired: boolean
  daysLeft: number
  trialEndsAt: string | null
  features: PlanFeature[]
  disabledFeatures: (PlanFeature & { requiredPlan: string })[]
  planInfo: {
    name: string
    price: number
    priceLabel: string
    description: string
  }
}

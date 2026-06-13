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

export interface FactorRendimiento {
  id: string
  ingredienteId: string
  ingrediente?: Ingrediente
  porcentajeRendimiento: number
  pesoNeto: number
  pesoBruto: number
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface RecetaComponente {
  id: string
  recetaId: string
  ingredienteId: string
  ingrediente?: Ingrediente
  cantidad: number
  unidad: string
}

export interface Receta {
  id: string
  nombre: string
  descripcion?: string
  porciones: number
  costoTotal?: number
  costoPorcion?: number
  componentes: RecetaComponente[]
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface MenuReceta {
  id: string
  menuId: string
  recetaId: string
  receta?: Receta
  precioVenta: number
  porcentajeCosto?: number
}

export interface Menu {
  id: string
  nombre: string
  descripcion?: string
  recetas: MenuReceta[]
  organizationId: string
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

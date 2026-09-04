// ── Catálogo comercial ──────────────────────────────────────────────────────
// Copy, precios y beneficios de marketing. Los precios REALES los valida el
// backend (billing.logic.ts); acá viven para render sin round-trip.

export type PlanId = "free" | "pro" | "academia"
export type PaidPlanId = "pro" | "academia"
export type PaymentMethodId = "tarjeta" | "pse" | "nequi"
export type BookFormat = "fisico" | "digital"

export interface PlanEntry {
  id: PlanId
  label: string
  amount: number
  period: string
  benefits: string[]
}

export const PLAN_CATALOG: Record<PlanId, PlanEntry> = {
  free: {
    id: "free",
    label: "Free",
    amount: 0,
    period: "14 días de prueba",
    benefits: ["Calculadoras básicas", "Prueba inicial", "Acceso limitado"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    amount: 30000,
    period: "COP / mes",
    benefits: [
      "Todo ilimitado",
      "Exportación PDF",
      "Banco de recetas base (+1.000)",
      "Factor de rendimiento completo",
      "Soporte prioritario",
    ],
  },
  academia: {
    id: "academia",
    label: "Academia",
    amount: 50000,
    period: "COP / mes",
    benefits: [
      "Todo de Pro",
      "Acceso completo a cursos",
      "Certificación incluida",
      "Consultoría mensual 1:1",
    ],
  },
}

export const PAYMENT_METHODS: Array<{ id: PaymentMethodId; label: string }> = [
  { id: "tarjeta", label: "Tarjeta débito/crédito" },
  { id: "pse", label: "PSE" },
  { id: "nequi", label: "Nequi / Daviplata" },
]

export const PSE_BANKS = ["Bancolombia", "Davivienda", "Banco de Bogotá", "BBVA", "Nequi", "Scotiabank Colpatria"]

export const DOCUMENT_TYPES = ["Cédula de ciudadanía", "Cédula de extranjería", "Pasaporte"]

export const BOOK = {
  title: "Libro de Costos A&B",
  prices: { fisico: 250000, digital: 100000 } as Record<BookFormat, number>,
}

export const PROGRAMS = [
  "Introducción",
  "Gestión de Almacén",
  "La Receta",
  "Factor de Rendimiento",
  "Gestión del Costo",
  "Diplomado en Gestión de Costos A&B",
] as const

export type ProgramId = (typeof PROGRAMS)[number]

/** slug de curso (ruta /courses/:id) → nombre de programa por defecto */
export const COURSE_PROGRAM: Record<string, ProgramId> = {
  introduccion: "Introducción",
  almacen: "Gestión de Almacén",
  receta: "La Receta",
  rendimiento: "Factor de Rendimiento",
  costo: "Gestión del Costo",
  diplomado: "Diplomado en Gestión de Costos A&B",
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount)
}

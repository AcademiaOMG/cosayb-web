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

/** Comparativa de planes para /planes. `true`/`false` = incluido/no incluido; texto = matiz. */
export interface ComparisonRow {
  label: string
  values: Record<PlanId, boolean | string>
}

export const PLAN_COMPARISON: ComparisonRow[] = [
  { label: "Calculadoras (valoración, punto de equilibrio, factor de rendimiento)", values: { free: "Básicas", pro: "Completas", academia: "Completas" } },
  { label: "Inventario de ingredientes", values: { free: "Con límite", pro: "Ilimitado", academia: "Ilimitado" } },
  { label: "Recetas y menús", values: { free: "Con límite", pro: "Ilimitados", academia: "Ilimitados" } },
  { label: "Banco de recetas base (+1.000)", values: { free: false, pro: true, academia: true } },
  { label: "Exportación a PDF y Excel", values: { free: false, pro: true, academia: true } },
  { label: "Equipo e invitaciones", values: { free: "Básico", pro: "Ampliado", academia: "Ampliado" } },
  { label: "Roles personalizados", values: { free: false, pro: true, academia: true } },
  { label: "Roles académicos (docente, estudiante)", values: { free: false, pro: false, academia: true } },
  { label: "Cursos y certificación", values: { free: false, pro: false, academia: true } },
  { label: "Consultoría mensual 1:1", values: { free: false, pro: false, academia: true } },
  { label: "Soporte", values: { free: "Centro de ayuda", pro: "Prioritario", academia: "Prioritario" } },
]

export const PLAN_FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito tarjeta para empezar?", a: "No. Creas tu cuenta y tienes 14 días de prueba con funciones Pro, sin tarjeta." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Cancelas desde Configuración > Facturación y conservas el plan hasta el final del periodo ya pagado." },
  { q: "¿Qué pasa si subo o bajo de plan?", a: "Al subir pagas el valor completo del nuevo plan y empieza un periodo de 30 días. Al bajar, el cambio aplica al terminar el periodo pagado." },
  { q: "¿Qué medios de pago aceptan?", a: "Tarjeta débito o crédito, PSE y Nequi / Daviplata, en pesos colombianos (COP)." },
  { q: "¿Qué pasa si un cobro falla?", a: "Te avisamos dentro de la plataforma y por correo y reintentamos el cobro. Tienes 5 días para actualizar tu método de pago antes de pasar a Free; tus datos se conservan." },
  { q: "¿Hay reembolso?", a: "Sí: el primer cobro de un plan de pago es reembolsable dentro de los 7 días. Mira la política de reembolso." },
]

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

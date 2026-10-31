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
  /** Precio final con IVA incluido (COP/mes). El backend valida el cobro real. */
  amount: number
  /** Desglose comercial; null en Free */
  net: number | null
  tax: number | null
  period: string
  /** Qué incluye, con los límites reales (espejo de membership_features, migración 0033) */
  benefits: string[]
  /** Restricciones explícitas del plan */
  restrictions: string[]
}

/** Límites del periodo gratuito: 10 días (espejo de FREE_PERIOD_DAYS en el API). */
export const FREE_PERIOD_DAYS = 10

export const PLAN_CATALOG: Record<PlanId, PlanEntry> = {
  free: {
    id: "free",
    label: "Free",
    amount: 0,
    net: null,
    tax: null,
    period: `${FREE_PERIOD_DAYS} días gratis`,
    benefits: [
      "1 usuario por negocio",
      `Acceso gratuito durante ${FREE_PERIOD_DAYS} días`,
      "Visualización de recetas",
      "Hasta 3 recetas propias",
      "Hasta 3 ingredientes propios",
      "1 menú con el banco de recetas",
      "1 factor de rendimiento",
      "1 punto de equilibrio",
    ],
    restrictions: [
      `Al terminar los ${FREE_PERIOD_DAYS} días la cuenta queda en solo lectura (tus datos se conservan)`,
      "Sin soporte técnico",
      "Sin soporte gastronómico",
      "Sin exportación de datos",
    ],
  },
  pro: {
    id: "pro",
    label: "Pro",
    amount: 42000,
    net: 35294,
    tax: 6706,
    period: "COP / mes · IVA incluido",
    benefits: [
      "Hasta 2 usuarios por negocio",
      "Acceso ilimitado a cocina",
      "Visualización de recetas",
      "Hasta 50 recetas propias",
      "Hasta 50 ingredientes propios",
      "Hasta 50 menús con el banco de recetas",
      "Hasta 30 factores de rendimiento",
      "Hasta 30 puntos de equilibrio",
      "Soporte técnico: 10 solicitudes al mes",
      "Soporte gastronómico",
      "Exportación de datos",
    ],
    restrictions: [],
  },
  academia: {
    id: "academia",
    label: "Academia",
    amount: 60000,
    net: 50420,
    tax: 9580,
    period: "COP / mes · IVA incluido",
    benefits: [
      "Hasta 5 usuarios por negocio",
      "Acceso ilimitado a cocina",
      "Visualización de recetas",
      "Recetas propias (cantidad por definir)",
      "Ingredientes propios (cantidad por definir)",
      "Hasta 100 menús con el banco de recetas",
      "Hasta 50 factores de rendimiento",
      "Hasta 50 puntos de equilibrio",
      "Soporte técnico ilimitado",
      "Soporte gastronómico (cuota mensual por definir)",
      "Exportación de datos",
    ],
    restrictions: [],
  },
}

/** Comparativa de planes para /planes. `true`/`false` = incluido/no incluido; texto = valor. */
export interface ComparisonRow {
  label: string
  values: Record<PlanId, boolean | string>
}

export const PLAN_COMPARISON: ComparisonRow[] = [
  { label: "Usuarios por negocio", values: { free: "1", pro: "Hasta 2", academia: "Hasta 5" } },
  { label: "Duración", values: { free: `${FREE_PERIOD_DAYS} días, luego solo lectura`, pro: "Mensual", academia: "Mensual" } },
  { label: "Visualización de recetas", values: { free: true, pro: true, academia: true } },
  { label: "Recetas propias", values: { free: "Hasta 3", pro: "Hasta 50", academia: "Por definir" } },
  { label: "Ingredientes propios", values: { free: "Hasta 3", pro: "Hasta 50", academia: "Por definir" } },
  { label: "Menús (con el banco de recetas)", values: { free: "1", pro: "Hasta 50", academia: "Hasta 100" } },
  { label: "Factores de rendimiento", values: { free: "1", pro: "Hasta 30", academia: "Hasta 50" } },
  { label: "Puntos de equilibrio", values: { free: "1", pro: "Hasta 30", academia: "Hasta 50" } },
  { label: "Acceso ilimitado a cocina", values: { free: false, pro: true, academia: true } },
  { label: "Exportación de datos", values: { free: false, pro: true, academia: true } },
  { label: "Soporte técnico", values: { free: false, pro: "10 solicitudes al mes", academia: "Ilimitado" } },
  { label: "Soporte gastronómico", values: { free: false, pro: true, academia: "Cuota mensual por definir" } },
]

export const PLAN_FAQ: { q: string; a: string }[] = [
  { q: "¿Necesito tarjeta para empezar?", a: `No. Creas tu cuenta y tienes ${FREE_PERIOD_DAYS} días gratis con el plan Free, sin tarjeta.` },
  { q: "¿Qué pasa cuando terminan los 10 días del plan Free?", a: "Tu cuenta pasa a solo lectura: puedes ver tus datos, pero no crear ni editar. No se elimina nada. Para volver a editar, elige Pro o Academia." },
  { q: "¿Los precios incluyen IVA?", a: "Sí. Pro cuesta $42.000 COP al mes (IVA incluido: $35.294 + $6.706 de IVA) y Academia $60.000 COP al mes (IVA incluido: $50.420 + $9.580 de IVA)." },
  { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Cancelas desde Configuración > Facturación y conservas el plan hasta el final del periodo ya pagado." },
  { q: "¿Qué pasa si subo o bajo de plan?", a: "Al subir pagas el valor completo del nuevo plan y empieza un periodo de 30 días. Al bajar, el cambio aplica al terminar el periodo pagado. Tus datos nunca se eliminan: si superas el límite del nuevo plan, los conservas y solo se bloquea crear más." },
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

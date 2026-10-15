import { validateEmail, validateName } from "@/lib/auth/validation"
import type { SupportTicketInput, TicketCategory } from "./types"

export const TICKET_CATEGORIES: { id: TicketCategory; label: string }[] = [
  { id: "cuenta", label: "Mi cuenta o acceso" },
  { id: "facturacion", label: "Planes, pagos y facturas" },
  { id: "tecnico", label: "Problema técnico" },
  { id: "sugerencia", label: "Sugerencia o idea" },
  { id: "otro", label: "Otro" },
]

export const SUBJECT_MAX = 120
export const MESSAGE_MIN = 10
export const MESSAGE_MAX = 4000

export type TicketErrors = Partial<Record<"name" | "email" | "category" | "subject" | "message" | "consent", string>>

/** Valida el formulario de soporte. Devuelve un objeto vacío si todo está bien. */
export function validateTicket(input: Partial<SupportTicketInput>, consent: boolean): TicketErrors {
  const errors: TicketErrors = {}
  const name = validateName(input.name ?? "")
  if (name) errors.name = name
  const email = validateEmail(input.email ?? "")
  if (email) errors.email = email
  if (!TICKET_CATEGORIES.some((c) => c.id === input.category)) errors.category = "Elige un tema."
  const subject = (input.subject ?? "").trim()
  if (subject.length < 4) errors.subject = "Escribe un asunto (mínimo 4 caracteres)."
  else if (subject.length > SUBJECT_MAX) errors.subject = `Máximo ${SUBJECT_MAX} caracteres.`
  const message = (input.message ?? "").trim()
  if (message.length < MESSAGE_MIN) errors.message = `Cuéntanos un poco más (mínimo ${MESSAGE_MIN} caracteres).`
  else if (message.length > MESSAGE_MAX) errors.message = `Máximo ${MESSAGE_MAX} caracteres.`
  if (!consent) errors.consent = "Debes aceptar la política de privacidad."
  return errors
}

export function hasErrors(e: TicketErrors): boolean {
  return Object.values(e).some(Boolean)
}

// Datos sensibles de pago: nunca se persisten ni se envían completos.

/** Últimos 4 dígitos de un PAN "NNNN NNNN NNNN NNNN". null si no hay 4 dígitos. */
export function deriveCardLast4(cardNumber: string): string | null {
  const digits = (cardNumber ?? "").replace(/\D/g, "")
  if (digits.length < 4) return null
  return digits.slice(-4)
}

/** Etiqueta segura para la pantalla de revisión. */
export function maskedCardLabel(cardNumber: string): string {
  const last4 = deriveCardLast4(cardNumber)
  return last4 ? `Tarjeta terminada en **** ${last4}` : "Tarjeta"
}

/** Agrupa dígitos de 4 en 4 mientras el usuario escribe. */
export function formatCardInput(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim()
}

/** Formatea vencimiento como MM/AA. */
export function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Textos del panel de plataforma en español claro. FUENTE ÚNICA: ningún código técnico
 * (slug de rol, recurso o acción de permiso, clave de función, acción de auditoría)
 * debe llegar a la pantalla; se muestra siempre a través de estas funciones.
 *
 * Las funciones devuelven una versión legible aunque el código no esté en el diccionario
 * (nunca el código crudo), pero cada código conocido debe tener su texto propio.
 */

/** «platform_billing» → «Platform billing». Último recurso para códigos que aún no están en el diccionario. */
export function humanize(code: string): string {
  const text = code.replace(/[_.:-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ""
}

/** Rol (de plataforma o de negocio) → nombre para mostrar. Ej. `platform_support` → «Soporte». */
export function roleLabel(slug: string): string {
  return humanize(slug)
}

/** Área de un permiso → nombre. Ej. `platform_billing` → «Facturación de la plataforma». */
export function permissionResourceLabel(resource: string): string {
  return humanize(resource)
}

/** Acción de un permiso → verbo. Ej. `update` → «Modificar». */
export function permissionActionLabel(action: string): string {
  return humanize(action)
}

/** Permiso completo → frase corta. Ej. (`platform_billing`, `update`) → «Cambiar planes y facturación». */
export function permissionLabel(resource: string, action: string): string {
  return `${permissionActionLabel(action)} · ${permissionResourceLabel(resource)}`
}

/** Acción de auditoría → frase. Ej. `billing.subscription.cancel` → «Canceló la suscripción». */
export function auditActionLabel(action: string): string {
  return humanize(action)
}

/** Función/límite de una membresía → nombre. Ej. `max_recipes` → «Recetas máximas». */
export function featureLabel(key: string): string {
  return humanize(key)
}

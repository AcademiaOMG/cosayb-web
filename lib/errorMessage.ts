/**
 * Convierte un error capturado en un texto comprensible en español para
 * mostrar en un toast. Los mensajes del API (ya en español) se muestran tal
 * cual; los técnicos (fallos de red, JSON inválido, códigos HTTP) se
 * sustituyen por `fallback`.
 */
const NETWORK_RE = /failed to fetch|networkerror|network request failed|load failed|fetch failed|econnrefused/i
const TECHNICAL_RE = /unexpected token|is not valid json|undefined|\[object|typeerror|referenceerror|syntaxerror|^\s*(internal server error|bad gateway|service unavailable|gateway timeout|not found|bad request|unauthorized|forbidden|conflict)\s*$|^\s*http\s*\d{3}/i

export const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo."

export function friendlyError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : ""
  const msg = raw.trim()
  if (!msg) return fallback
  if (NETWORK_RE.test(msg)) return NETWORK_ERROR_MESSAGE
  if (TECHNICAL_RE.test(msg)) return fallback
  return msg
}

/**
 * Lógica pura de redirección del flujo de entrada (login → dashboard).
 *
 * Causa raíz de la oscilación login ↔ dashboard ↔ onboarding: dos
 * "autoridades" distintas decidían si había sesión.
 *   - /login usaba authClient.getSession() → Better Auth responde desde la
 *     cookie firmada (cookieCache de 5 min) SIN consultar la BD.
 *   - SessionGuard (dentro del dashboard) usaba GET /api/v1/me → consulta la
 *     BD. Una sesión borrada en servidor (login en otro lado: "sesión única
 *     por usuario", logout, expiración) sigue viéndose "válida" en el cliente.
 * Resultado: dashboard → 401 → /login → getSession() "válida" → /onboarding
 * → /dashboard → 401 → … hasta que expiraba la cookie caché.
 *
 * Arreglo: una sola autoridad (el API) para decidir si /login redirige, y el
 * guard limpia la cookie al expulsar para que /login no pueda rebotar.
 */

/** Destino por defecto tras autenticarse: directo al dashboard. */
export const DEFAULT_POST_LOGIN_PATH = "/dashboard"

/**
 * Acepta solo rutas internas. Rechaza "//host" y "/\host" (open redirect).
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/")) return null
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null
  return raw
}

/** returnTo explícito > compra pendiente > dashboard. */
export function resolvePostLoginPath(opts: {
  returnTo?: string | null
  pendingPath?: string | null
}): string {
  return safeReturnTo(opts.returnTo) ?? safeReturnTo(opts.pendingPath) ?? DEFAULT_POST_LOGIN_PATH
}

/** URL de login que conserva la ruta interna solicitada (deep link). */
export function buildLoginUrl(pathname: string, search = ""): string {
  const target = safeReturnTo(pathname + search)
  if (!target || target === "/" || target.startsWith("/login")) return "/login"
  return `/login?returnTo=${encodeURIComponent(target)}`
}

export type ServerSessionState = "valid" | "invalid" | "unknown"

/**
 * Consulta al API (misma autoridad que SessionGuard) si la sesión es válida.
 * 2xx → valid; 401/403 → invalid; red caída / 5xx → unknown (no se redirige
 * ni se expulsa por un fallo transitorio).
 */
export async function checkServerSession(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ServerSessionState> {
  try {
    const res = await fetchImpl(`${apiBase}/api/v1/me`, {
      credentials: "include",
      cache: "no-store",
    })
    if (res.ok) return "valid"
    if (res.status === 401 || res.status === 403) return "invalid"
    return "unknown"
  } catch {
    return "unknown"
  }
}

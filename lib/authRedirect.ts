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
 * Acepta solo rutas internas. Rechaza "//host" y "/\host" (open redirect) y los caracteres
 * de control: el navegador elimina tab/salto de línea de las URLs, así que "/\t/host" se
 * convertiría en "//host".
 */
export function safeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/")) return null
  if (raw.startsWith("//") || raw.startsWith("/\\")) return null
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null
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

// ─── Onboarding obligatorio para usuarios sin organización ────────────────

/** Ruta de creación del primer negocio. */
export const ONBOARDING_PATH = "/onboarding"

/** Lo mínimo de GET /api/v1/me/context que necesita la decisión de destino. */
export interface OrgState {
  identityType: "platform" | "tenant" | undefined
  hasOrganization: boolean
  impersonationActive: boolean
}

/** URL de onboarding que conserva el destino al que se quería llegar. */
export function buildOnboardingUrl(returnTo?: string | null): string {
  const target = safeReturnTo(returnTo)
  if (!target || target === "/" || target.startsWith(ONBOARDING_PATH) || target.startsWith("/login")) {
    return ONBOARDING_PATH
  }
  return `${ONBOARDING_PATH}?returnTo=${encodeURIComponent(target)}`
}

/** Una identidad de plataforma sin impersonación nunca se fuerza al onboarding. */
function isForcedTenant(s: OrgState): boolean {
  if (s.impersonationActive) return false
  return s.identityType !== "platform"
}

/**
 * ¿Debe el usuario crear su negocio antes de usar el área interna (app)?
 * Solo tenants autenticados sin organización. Plataforma/super admin e
 * impersonación quedan exentos.
 */
export function needsOnboarding(s: OrgState): boolean {
  return !s.hasOrganization && isForcedTenant(s)
}

/** Página de aceptación de una invitación: quien la abre aún no tiene negocio y no debe pasar por el onboarding. */
export const INVITATION_PATH_PREFIX = "/accept-invitation/"

/** Destino tras autenticarse: onboarding (conservando returnTo) o el destino normal. */
export function resolveAuthenticatedDestination(s: OrgState, destination: string): string {
  // Con una invitación pendiente, el negocio es al que lo invitaron: no se le pide crear uno propio primero
  if (destination.startsWith(INVITATION_PATH_PREFIX)) return destination
  return needsOnboarding(s) ? buildOnboardingUrl(destination) : destination
}

export type OnboardingPageDecision = "show" | "dashboard" | "platform"

/**
 * Qué hace la página /onboarding. ?new=1 (negocio adicional) siempre muestra
 * el formulario. Sin ?new=1, quien ya tiene organización va al destino.
 */
export function decideOnboardingPage(s: OrgState, isNewOrgFlow: boolean): OnboardingPageDecision {
  if (isNewOrgFlow) return "show"
  if (s.identityType === "platform" && !s.impersonationActive) return "platform"
  return s.hasOrganization ? "dashboard" : "show"
}

/** Destino al terminar de crear el negocio: returnTo seguro o dashboard. */
export function resolveOnboardingFinishPath(returnTo: string | null | undefined): string {
  const t = safeReturnTo(returnTo)
  return t && !t.startsWith(ONBOARDING_PATH) && !t.startsWith("/login") ? t : DEFAULT_POST_LOGIN_PATH
}

export type OrgStateResult =
  | { status: "ok"; state: OrgState }
  | { status: "invalid" }
  | { status: "unknown" }

/** Lee el estado de organización desde /api/v1/me/context (misma fuente que usePermissions). */
export async function fetchOrgState(
  apiBase: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OrgStateResult> {
  try {
    const res = await fetchImpl(`${apiBase}/api/v1/me/context`, {
      credentials: "include",
      cache: "no-store",
    })
    if (res.status === 401 || res.status === 403) return { status: "invalid" }
    if (!res.ok) return { status: "unknown" }
    const body = await res.json()
    const d = body?.data
    if (!d) return { status: "unknown" }
    return {
      status: "ok",
      state: {
        identityType: d.identityType,
        hasOrganization: !!d.organization,
        impersonationActive: !!d.impersonation?.active,
      },
    }
  } catch {
    return { status: "unknown" }
  }
}

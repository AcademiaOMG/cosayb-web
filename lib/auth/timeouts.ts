/**
 * Plazos de las llamadas de autenticación. Sin ellos, si el API o su base no responden, la pantalla
 * se queda en "cargando" hasta que un proxy devuelve un 504 anónimo.
 */

/** Comprobar si ya hay sesión (al abrir /login): si tarda, se muestra el formulario. */
export const SESSION_CHECK_TIMEOUT_MS = 8_000
/** Iniciar sesión, registrarse o arrancar el flujo de Google. */
export const AUTH_ACTION_TIMEOUT_MS = 20_000

export const SERVER_BUSY_MESSAGE =
  "El servidor está tardando más de lo normal en responder. Espera unos segundos e inténtalo de nuevo."

export class RequestTimeoutError extends Error {
  constructor(public readonly ms: number) {
    super(`La solicitud superó ${ms} ms`)
    this.name = "RequestTimeoutError"
  }
}

/** Error HTTP de una llamada de auth hecha con fetch directo (no con authClient). */
export class AuthRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly requestId?: string | null,
  ) {
    super(`Auth respondió ${status}${code ? ` (${code})` : ""}`)
    this.name = "AuthRequestError"
  }
}

/** `fetch` con plazo: al vencer aborta la petición y lanza RequestTimeoutError. */
export async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit,
  ms: number,
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (timedOut) throw new RequestTimeoutError(ms)
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/** ¿El fallo es por plazo vencido o por un 5xx del servidor/proxy (no por datos del usuario)? */
export function isServerBusyError(err: unknown): boolean {
  if (err instanceof RequestTimeoutError) return true
  if (err instanceof AuthRequestError) return err.status >= 500
  const name = (err as { name?: string } | null)?.name
  return name === "TimeoutError" || name === "AbortError"
}

/** Texto para mostrar cuando una llamada de auth lanzó una excepción. */
export function authFailureMessage(err: unknown, fallback: string): string {
  return isServerBusyError(err) ? SERVER_BUSY_MESSAGE : fallback
}

/**
 * Reporte de errores opcional a Sentry, SIN dependencias: si NEXT_PUBLIC_SENTRY_DSN
 * está definido, envía el evento por la API HTTP de Sentry (/store). Sin DSN no hace
 * nada. Para tracing o source maps conviene instalar @sentry/nextjs más adelante.
 */

export interface ParsedDsn {
  endpoint: string
  publicKey: string
}

/** «https://KEY@oXXXX.ingest.sentry.io/123» → endpoint de /store y clave pública. */
export function parseDsn(dsn: string | undefined | null): ParsedDsn | null {
  if (!dsn) return null
  try {
    const u = new URL(dsn)
    const projectId = u.pathname.replace(/^\/+/, "").split("/").pop()
    if (!u.username || !projectId) return null
    const base = u.pathname.replace(/\/[^/]*$/, "")
    return {
      endpoint: `${u.protocol}//${u.host}${base}/api/${projectId}/store/`,
      publicKey: u.username,
    }
  } catch {
    return null
  }
}

export interface ErrorContext {
  /** Dónde ocurrió (ruta, componente…). */
  where?: string
  digest?: string
  extra?: Record<string, unknown>
}

export function buildEvent(error: unknown, ctx: ErrorContext = {}, now: Date = new Date()) {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Error desconocido")
  return {
    timestamp: Math.floor(now.getTime() / 1000),
    platform: "javascript",
    level: "error",
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_RELEASE,
    exception: {
      values: [{ type: err.name, value: err.message, stacktrace: err.stack ? { frames: [{ filename: err.stack.slice(0, 2000) }] } : undefined }],
    },
    tags: { where: ctx.where, digest: ctx.digest },
    extra: ctx.extra,
    request: typeof window !== "undefined" ? { url: window.location.href } : undefined,
  }
}

/** Envío de mejor esfuerzo; nunca lanza ni bloquea la UI. */
export function reportError(error: unknown, ctx: ErrorContext = {}): void {
  try {
    const dsn = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN)
    if (!dsn || typeof fetch === "undefined") return
    const url = `${dsn.endpoint}?sentry_version=7&sentry_key=${encodeURIComponent(dsn.publicKey)}`
    void fetch(url, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildEvent(error, ctx)),
    }).catch(() => undefined)
  } catch {
    /* el monitoreo nunca debe romper la app */
  }
}

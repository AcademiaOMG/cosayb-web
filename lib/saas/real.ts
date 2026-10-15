// Cliente HTTP del modo real. Los endpoints concretos (según docs/SAAS_API_CONTRATO.md del repo
// del API) viven en el bloque realServices de services.ts.

import { getActiveOrgId } from "@/lib/activeOrg"
import { SaasError } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export async function saasFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const activeOrg = getActiveOrgId()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      signal: controller.signal,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(activeOrg ? { "X-Organization-Id": activeOrg } : {}),
        ...init.headers,
      },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SaasError("TIMEOUT", "La operación tardó demasiado. Inténtalo de nuevo.")
    }
    throw new SaasError("NETWORK", "No pudimos conectar con el servidor. Revisa tu conexión.")
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    let code = `HTTP_${res.status}`
    let message = "No pudimos completar la operación. Inténtalo nuevamente."
    try {
      const body = await res.json()
      if (body.code) code = body.code
      if (body.error) message = body.error
      else if (body.message) message = body.message
    } catch {
      /* respuesta no JSON */
    }
    throw new SaasError(code, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** GET/POST que devuelve `{ data }` y entrega solo `data`. */
export async function saasData<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const body = await saasFetch<{ data: T }>(endpoint, init)
  return body.data
}

export const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) })

export function qs(params: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "" && v !== "all") q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ""
}

// Exportación de datos de la cuenta en modo mock: compone un JSON con lo que el
// usuario ya puede leer a través del API existente. En modo real lo entrega el
// API (ENDPOINTS.accountExport).

import {
  getBreakEvenHistory, getCurrentOrganization, getIngredientes, getMenus, getMyProfile, getRecipes, getValuations,
} from "@/lib/api"
import type { AccountExport } from "./types"

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

export async function buildAccountExport(): Promise<AccountExport> {
  const [profile, org, ingredientes, recipes, menus, valuations, breakEven] = await Promise.all([
    safe(() => getMyProfile().then((r) => r.data)),
    safe(() => getCurrentOrganization().then((r) => r.data)),
    safe(() => getIngredientes().then((r) => r.data)),
    safe(() => getRecipes(undefined, "own", 1, 500).then((r) => r.data)),
    safe(() => getMenus().then((r) => r.data)),
    safe(() => getValuations().then((r) => r.data)),
    safe(() => getBreakEvenHistory().then((r) => r.data)),
  ])

  return {
    exportedAt: new Date().toISOString(),
    user: (profile as unknown as Record<string, unknown>) ?? {},
    organizations: org ? [org as unknown as Record<string, unknown>] : [],
    data: {
      ingredientes: ingredientes ?? [],
      recetas: recipes ?? [],
      menus: menus ?? [],
      valoraciones: valuations ?? [],
      puntoEquilibrio: breakEven ?? [],
    },
  }
}

/** Descarga un objeto como archivo JSON desde el navegador. */
export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

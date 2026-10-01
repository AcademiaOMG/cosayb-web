import { test, expect, type Page } from "@playwright/test"

/**
 * Condición automática de la tarea 8: SIN SCROLL HORIZONTAL en ninguna
 * sección, a viewport de celular real (390×844).
 *
 * Se mide a nivel de página/viewport en los dos contenedores que pueden
 * generar scroll horizontal en esta app:
 *   1. documentElement (scroll de la página)
 *   2. <main> de AppShell (overflow-y:auto ⇒ overflow-x computa a auto,
 *      es donde el contenido de las secciones desborda en la práctica)
 *
 * El scroll horizontal INTERNO permitido (sub-nav de Configuración y Mi
 * cuenta, con overflow-x-auto propio) no afecta estas medidas: sus
 * contenedores tienen overflow-x:auto y por tanto su scrollWidth interno
 * no se propaga a main ni al documento.
 *
 * Requiere tests/.auth/state.json (ver tests/global-setup.ts). Si la sesión
 * expiró o es inválida, el test FALLA con mensaje explícito: nunca se salta
 * en silencio.
 */

const ROUTES = [
  "/dashboard",
  "/inventario",
  "/factor-rendimiento",
  "/recetas",
  "/menu",
  "/valoracion",
  "/punto-equilibrio",
  "/precios-mercado",
  "/configuracion",
  "/cuenta",
] as const

interface OverflowReport {
  route: string
  docOverflow: number
  mainOverflow: number
  widest: string
}

async function measureOverflow(page: Page, route: string): Promise<OverflowReport> {
  return page.evaluate((currentRoute) => {
    const doc = document.documentElement
    const main = document.querySelector("main")
    const docOverflow = doc.scrollWidth - window.innerWidth
    const mainOverflow = main ? main.scrollWidth - main.clientWidth : 0

    // Elemento más ancho que escapa del viewport (para depurar)
    let widest = ""
    let widestRight = window.innerWidth
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const rect = el.getBoundingClientRect()
      if (rect.right > widestRight && rect.width > 0 && getComputedStyle(el).position !== "fixed") {
        widestRight = rect.right
        widest = `${el.tagName.toLowerCase()}.${el.className?.toString().split(" ")[0] ?? ""}`
      }
    }
    return { route: currentRoute, docOverflow, mainOverflow, widest }
  }, route)
}

for (const route of ROUTES) {
  test(`sin scroll horizontal en ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: "load" })

    // Sesión inválida / onboarding pendiente = cobertura no válida → fallar.
    // (Usa startsWith porque /configuracion redirige internamente a /configuracion/equipo)
    const landed = new URL(page.url()).pathname
    expect(
      landed.startsWith(route),
      `Sesión no válida para ${route}: redirigió a ${landed}. ` +
        `Ejecuta "npm run test:e2e:auth" y completa el login una vez.`
    ).toBe(true)

    // Espera a que SWR pinte datos reales (si falla el backend, las páginas
    // quedan en estado de error y la medición seguiría siendo del layout)
    await page.waitForLoadState("networkidle").catch(() => {})
    await page.waitForTimeout(500)

    const report = await measureOverflow(page, route)

    testInfo.annotations.push({
      type: "overflow",
      description: `doc=${report.docOverflow}px main=${report.mainOverflow}px wider=${report.widest || "-"}`,
    })

    expect(
      report.docOverflow,
      `Scroll horizontal de PÁGINA en ${route}: ${report.docOverflow}px (elemento más ancho: ${report.widest || "n/d"})`
    ).toBeLessThanOrEqual(1)

    expect(
      report.mainOverflow,
      `Scroll horizontal del CONTENIDO en ${route}: ${report.mainOverflow}px (elemento más ancho: ${report.widest || "n/d"})`
    ).toBeLessThanOrEqual(1)
  })
}

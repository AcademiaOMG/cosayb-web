import { test, expect, type Page, type Route } from "@playwright/test"

/**
 * Validación de layout con DATOS FIXTURE (no requiere login real).
 *
 * Intercepta el backend para pintar: (a) las 10 secciones con datos reales
 * de lista (tablas → tarjetas en móvil) y (b) los flujos que abren modales
 * o vistas de detalle, cuyo desborde NO es visible a nivel de documento
 * (los position:fixed no generan scroll del viewport), por lo que aquí se
 * mide además por rectángulos que escapan del viewport.
 *
 * Cada respuesta mock incluye CORS (las fetch son cross-origin a
 * NEXT_PUBLIC_API_URL con credentials) y se responde el preflight OPTIONS.
 * fixtures de API: solo lectura; ningún credencial en el repo.
 */

const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "http://localhost:3002",
  "access-control-allow-credentials": "true",
  "access-control-allow-headers": "content-type, x-organization-id, authorization, x-requested-with",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
}

async function fulfill(route: Route, body: unknown, status = 200) {
  const isPreflight = route.request().method() === "OPTIONS"
  await route.fulfill({
    status: isPreflight ? 204 : status,
    headers: CORS_HEADERS,
    ...(isPreflight ? {} : { json: body }),
  })
}

const CTX = {
  scope: "organization",
  identityType: "tenant",
  roles: ["org_owner"],
  permissions: [
    "create:menus", "update:menus", "delete:menus", "read:menus",
    "create:recipes", "update:recipes", "delete:recipes", "read:recipes",
    "create:ingredients", "update:ingredients", "delete:ingredients", "read:ingredients",
    "create:yieldFactors", "update:yieldFactors", "delete:yieldFactors", "read:yieldFactors",
    "create:valuations", "read:valuations",
    "create:breakEven", "read:breakEven", "update:breakEven", "delete:breakEven",
    "update:organization", "list:members", "update:members",
    "create:invitations", "list:invitations",
    "list:organizationRoles", "create:organizationRoles",
    "read:billing", "read:organizationActivity",
  ],
  organization: {
    id: "org_demo",
    name: "Cocina Cosayb Organización Demonstration",
    membership: "pro",
    features: [],
  },
  memberships: [],
  platformRoles: ["super_admin"],
  platformPermissions: [],
  impersonation: null,
}

const MENUS = {
  data: [
    {
      id: "m1",
      nombre: "Menú corporativo Ejecutivo para Convención Anual",
      fecha: "2026-10-15",
      numPersonas: 240,
      recetasCount: 8,
      pctMateriaPrima: "34.5",
      indicator: "34.5",
      recetas: [],
    },
    {
      id: "m2",
      nombre: "Catering matrimonio fin de semana largo",
      fecha: "2026-11-02",
      numPersonas: 150,
      recetasCount: 5,
      pctMateriaPrima: "30.1",
      indicator: "30.1",
      recetas: [],
    },
  ],
  total: 2,
}

const FACTORS = {
  data: [
    {
      id: "f1",
      ingredientName: "Pechuga de pollo con piel y hueso",
      yieldFactor: "0.62",
      realCostPerGram: "3.45",
      variant: "bfactor",
      updatedAt: "2026-09-20T00:00:00.000Z",
      totalWeightGrams: "1000",
      netWeightGrams: "620",
      totalWasteGrams: "380",
    },
    {
      id: "f2",
      ingredientName: "Zanahoria orgánica premium lavada",
      yieldFactor: "0.81",
      realCostPerGram: "1.20",
      variant: "bfactorveg",
      updatedAt: "2026-09-21T00:00:00.000Z",
      totalWeightGrams: "500",
      netWeightGrams: "405",
      totalWasteGrams: "95",
    },
  ],
  total: 2,
}

const BREAK_EVEN = {
  data: [
    {
      id: "b1",
      createdAt: "2026-09-18T00:00:00.000Z",
      totalFixedCosts: 4500000,
      salePrice: 18000,
      variableCost: 6500,
      breakEvenUnits: 382.4,
      breakEvenRevenue: 6884000,
    },
    {
      id: "b2",
      createdAt: "2026-09-25T00:00:00.000Z",
      totalFixedCosts: 1250000,
      salePrice: 9500,
      variableCost: 3200,
      breakEvenUnits: 198.4,
      breakEvenRevenue: 1885000,
    },
  ],
  total: 2,
}

const VALUATIONS = {
  data: [
    {
      id: "v1",
      name: "Bandeja paisa con aguacate adicional",
      indicator: "MUY BUENO",
      pctMateriaprima: "31.2",
      costMateriaprima: "8500",
      suggestedPrice: "27000",
      actualPrice: "25000",
      refType: "recipe",
      createdAt: "2026-09-10T00:00:00.000Z",
    },
    {
      id: "v2",
      name: "Entrada de crema de berenjena ahumada",
      indicator: "REGULAR",
      pctMateriaprima: "36.8",
      costMateriaprima: "4200",
      suggestedPrice: "12500",
      actualPrice: "",
      refType: "dish",
      createdAt: "2026-09-12T00:00:00.000Z",
    },
  ],
  total: 2,
}

const PRECIOS = {
  data: [
    {
      id: "p1",
      originalName: "Filete de res premium sin grasa",
      ingredientName: "Res / Carne de res",
      source: "exito",
      city: "bogota",
      pricePerKg: 32900,
      pricePerGram: "32.90",
    },
    {
      id: "p2",
      originalName: "Papa criolla blanca lavada presentación familiar",
      ingredientName: "Papa",
      source: "makro",
      city: "medellin",
      pricePerKg: 4800,
      pricePerGram: "4.80",
    },
  ],
  total: 2,
}

const INGREDIENTS = {
  data: Array.from({ length: 8 }, (_, i) => ({
    id: `i${i}`,
    name: i % 2 === 0 ? "Harina de trigo integral orgánica premium" : "AZÚCAR REFINADA",
    costPerGram: 0.0042,
    costPerUnit: 4200 + i * 100,
    weightGrams: 1000,
    userId: i === 7 ? null : "u1",
    priceConfirmedAt: i % 3 === 0 ? "2026-06-01T00:00:00.000Z" : "2026-09-20T00:00:00.000Z",
    origin: i === 7 ? "public" : "own",
  })),
  total: 8,
}

const RECIPES = {
  data: [
    {
      id: "r1",
      name: "Bandeja paisa con aguacate y guarnición especial",
      servings: "4",
      servingWeightG: "450",
      safetyMargin: "3",
      isBase: false,
      isPublic: false,
      itemCount: 8,
      updatedAt: "2026-09-19T00:00:00.000Z",
    },
    {
      id: "r2",
      name: "Salsa de ají costeño casero",
      servings: "10",
      servingWeightG: "30",
      safetyMargin: "2",
      isBase: true,
      isPublic: false,
      itemCount: 4,
      updatedAt: "2026-09-22T00:00:00.000Z",
    },
  ],
  total: 2,
}

const S = { isValidating: false, isLoading: false }

// Claves SWR de cada página (caché persistido por SWRProvider). El valor
// cacheado es lo que resuelve el fetcher de cada hook (ya desempaquetado).
const SWR_SEED: Array<[string, object]> = [
  ["me/context", { data: CTX, ...S }],
  ["ingredients", { data: INGREDIENTS.data, ...S }],
  ["yield-factors", { data: FACTORS.data, ...S }],
  ["valuations", { data: VALUATIONS.data, ...S }],
  ["break-even-history", { data: BREAK_EVEN.data, ...S }],
  ["menus", { data: MENUS.data, ...S }],
  ["recipes-catalog-menu", { data: RECIPES.data, ...S }],
  ["ingredients-catalog-menu", { data: INGREDIENTS.data, ...S }],
  ["precios-mercado?limit=50&offset=0", { data: { data: PRECIOS.data }, ...S }],
]

async function mockApi(page: Page) {
  // Cookie de sesión placeholder: solo pasa el chequeo de presencia del
  // proxy (proxy.ts no valida firma); toda la data viene de los fixtures.
  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: "e2e-fixture-session",
      domain: "localhost",
      path: "/",
      expires: Math.floor(Date.now() / 1000) + 3600,
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ])

  // Semilla del caché de SWR (SWRProvider lo restaura desde localStorage al
  // hidratar). En dev, el swap de provider ocurre mientras los fetches
  // iniciales siguen en vuelo: los resultados se escriben en el caché
  // anterior y las vistas quedan vacías aunque el backend responde 200.
  // Sembrar TODAS las claves antes de que corra el JS de la app elimina la
  // carrera; revalidateIfStale las revalida en background después.
  await page.addInitScript(
    (seed) => {
      const KEY = "cosayb.swr.v1.sin-org"
      try {
        const entries: Array<[string, object]> = JSON.parse(window.localStorage.getItem(KEY) || "[]")
        const present = new Set(entries.map(([k]) => k))
        for (const [key, state] of seed as Array<[string, object]>) {
          if (!present.has(key)) entries.push([key, state])
        }
        window.localStorage.setItem(KEY, JSON.stringify(entries))
      } catch {
        // localStorage inaccesible: el test fallará en la aserción de contenido
      }
    },
    SWR_SEED
  )

  // Ruta por defecto (menor prioridad): el resto de endpoints fallan →
  // mismos estados de error que una sesión sin datos.
  await page.route("**/api/v1/**", (route) => fulfill(route, { error: "mock: no fixture" }, 500))
  await page.route("**/api/auth/**", (route) => route.fulfill({ json: null }))

  await page.route("**/api/v1/me/context", (route) => fulfill(route, { data: CTX }))
  await page.route("**/api/v1/menus*", (route) => fulfill(route, MENUS))
  await page.route("**/api/v1/yield-factors*", (route) => fulfill(route, FACTORS))
  await page.route("**/api/v1/break-even*", (route) => fulfill(route, BREAK_EVEN))
  await page.route("**/api/v1/valuations*", (route) => fulfill(route, VALUATIONS))
  await page.route("**/api/v1/precios-mercado*", (route) => fulfill(route, PRECIOS))
  await page.route("**/api/v1/ingredients*", (route) => fulfill(route, INGREDIENTS))
  await page.route("**/api/v1/recipes*", (route) => fulfill(route, RECIPES))
  // detalle de menú (objeto) — prioridad sobre el listado menus*
  await page.route("**/api/v1/menus/m1", (route) => fulfill(route, { data: MENUS.data[0] }))
  await page.route("**/api/v1/menus/m1/costo", (route) =>
    fulfill(route, {
      data: {
        nombre: MENUS.data[0].nombre,
        numPersonas: 240,
        pctMateriaPrima: "34.5",
        costo: { recetas: [], materiaPrima: 120000, total: 380000 },
      },
    })
  )
  // tras la ruta genérica: counts sigue siendo error (los tabs lo toleran)
  await page.route("**/api/v1/recipes/counts", (route) => fulfill(route, { error: "mock" }, 500))
}

interface Report {
  docOverflow: number
  mainOverflow: number
  escaping: string[]
}

async function measure(page: Page): Promise<Report> {
  return page.evaluate(() => {
    const doc = document.documentElement
    const main = document.querySelector("main")
    const docOverflow = doc.scrollWidth - window.innerWidth
    const mainOverflow = main ? main.scrollWidth - main.clientWidth : 0

    // ¿Está dentro de un sub-nav con scroll horizontal propio (permitido)?
    const inAllowedScroller = (el: Element): boolean => {
      let p = el.parentElement
      while (p && p !== document.documentElement) {
        const ox = getComputedStyle(p).overflowX
        if ((ox === "auto" || ox === "scroll") && p.tagName === "NAV") return true
        p = p.parentElement
      }
      return false
    }

    const escaping: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === "hidden" || cs.display === "none") continue
      if (rect.right > window.innerWidth + 1 || rect.left < -1) {
        if (inAllowedScroller(el)) continue
        escaping.push(
          `${el.tagName.toLowerCase()}.${(el.className?.toString() || "").split(" ")[0]} right=${Math.round(rect.right)}`
        )
      }
    }
    return { docOverflow, mainOverflow, escaping: escaping.slice(0, 8) }
  })
}

async function expectNoOverflow(page: Page, label: string) {
  const report = await measure(page)
  expect(
    report.docOverflow,
    `[${label}] scroll de página: ${report.docOverflow}px — escapan: ${report.escaping.join(" | ")}`
  ).toBeLessThanOrEqual(1)
  expect(
    report.mainOverflow,
    `[${label}] scroll de main: ${report.mainOverflow}px — escapan: ${report.escaping.join(" | ")}`
  ).toBeLessThanOrEqual(1)
  expect(
    report.escaping,
    `[${label}] elementos que escapan del viewport: ${report.escaping.join(" | ")}`
  ).toEqual([])
}

type RouteContent = { text: string | RegExp; nav?: string }

/**
 * Espera a que la página se estabilice (hidratación + swap de provider de
 * SWR lector de la semilla localStorage) antes de aserciones.
 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.waitForTimeout(300)
}

async function expectRealContent(page: Page, label: string, content: RouteContent) {
  // Gate de features apagado = módulo bloqueado → la medición no cubre nada
  await expect(
    page.locator("text=Este módulo no está disponible en tu plan"),
    `[${label}] ModuleLocked visible: el fixture de me/context no llegó al cliente`
  ).toHaveCount(0)
  const locator = content.nav
    ? page.getByRole("navigation", { name: content.nav })
    : // Table renderiza ambas variantes (desktop oculta en móvil): elegir visible
      page.getByText(content.text).filter({ visible: true }).first()
  await expect(
    locator,
    `[${label}] no se pintó el contenido con datos fixture`
  ).toBeVisible()
}

const ROUTES: Array<{ route: string } & RouteContent> = [
  { route: "/dashboard", text: "¿Qué quieres revisar?" },
  { route: "/inventario", text: /Harina de trigo integral orgánica premium/ },
  { route: "/factor-rendimiento", text: /Pechuga de pollo con piel y hueso/ },
  { route: "/recetas", text: /Salsa de ají costeño casero/ },
  { route: "/menu", text: /Menú corporativo Ejecutivo para Convención Anual/ },
  { route: "/valoracion", text: /Calcula a cuánto vender cada plato/ },
  { route: "/punto-equilibrio", text: /PE Unidades/ },
  { route: "/precios-mercado", text: /Filete de res premium sin grasa/ },
  { route: "/configuracion", text: "", nav: "Secciones de configuración" },
  { route: "/cuenta", text: "", nav: "Secciones de mi cuenta" },
]

for (const entry of ROUTES) {
  const { route } = entry
  test(`datos fixture sin overflow en ${route}`, async ({ page }) => {
    await mockApi(page)
    await page.goto(route, { waitUntil: "load" })
    expect(new URL(page.url()).pathname.startsWith(route)).toBe(true)
    await settle(page)

    await expectRealContent(page, route, entry)

    // /valoracion: el historial (tarjetas Table) vive en la pestaña Historial
    if (route === "/valoracion") {
      await page.getByRole("button", { name: /Historial/i }).first().click()
      await page.waitForTimeout(400)
      await expect(
        page.getByText(/Bandeja paisa con aguacate adicional/).filter({ visible: true }).first()
      ).toBeVisible()
    }

    await expectNoOverflow(page, route)
  })
}

test("modales y vistas de detalle sin overflow", async ({ page }) => {
  await mockApi(page)

  // 1) Recetas → formulario (header de columnas + ItemRow apilados en móvil)
  await page.goto("/recetas", { waitUntil: "load" })
  await settle(page)
  await page.getByRole("button", { name: /Nueva receta/i }).click()
  await page.waitForTimeout(500)
  await expectNoOverflow(page, "recetas → RecipeFormModal")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(300)

  // 2) Punto de equilibrio → vista detalle (FixedCostRow + toolbar)
  await page.goto("/punto-equilibrio", { waitUntil: "load" })
  await settle(page)
  await page.getByRole("button", { name: "Nuevo cálculo", exact: true }).click()
  await page.waitForTimeout(400)
  await expectNoOverflow(page, "punto-equilibrio → DetailView")

  // 3) Menú → vista detalle de edición (toolbar de 3 filas en móvil)
  await page.goto("/menu", { waitUntil: "load" })
  await settle(page)
  await page.getByRole("button", { name: /Nuevo menú/i }).click()
  await page.waitForTimeout(400)
  await expectNoOverflow(page, "menu → DetailView edición")

  // 4) Precios → modal de detalle desde una card móvil
  await page.goto("/precios-mercado", { waitUntil: "load" })
  await settle(page)
  await page.getByRole("button", { name: /Ver detalle de/i }).first().click()
  await page.waitForTimeout(400)
  await expectNoOverflow(page, "precios → PriceDetailModal")

  // 5) Menú → modal de ver menú (footer apilado en móvil)
  await page.goto("/menu", { waitUntil: "load" })
  await settle(page)
  await page.getByRole("button", { name: /^Ver detalle/ }).first().click()
  await page.waitForTimeout(600)
  await expectNoOverflow(page, "menu → modal ver menú")
})

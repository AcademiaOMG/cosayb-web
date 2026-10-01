import { test as setup, expect } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const statePath = path.join(process.cwd(), "tests", ".auth", "state.json")

/**
 * Setup interactivo (headed): el desarrollador completa el login de Google
 * una vez y el estado de sesión se guarda en tests/.auth/state.json.
 *
 * Uso: npm run test:e2e:auth
 *
 * No hay credenciales en el repo: este archivo solo dispara el flujo real
 * de /login y serializa las cookies/orig storage que el navegador obtiene
 * del backend. El resultado va a un path gitignored.
 */
setup("login manual y guardado de estado de sesión", async ({ page }) => {
  fs.mkdirSync(path.dirname(statePath), { recursive: true })

  await page.goto("/login")

  // Espera a que el login manual (Google OAuth) complete y salga de /login.
  // Si ya había sesión en el navegador, /login redirige inmediatamente.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 180_000,
  })

  await page.context().storageState({ path: statePath })

  const saved = JSON.parse(fs.readFileSync(statePath, "utf8"))
  expect(
    Array.isArray(saved.cookies) && saved.cookies.length > 0,
    "El estado guardado no contiene cookies de sesión"
  ).toBe(true)

  console.log(`\nEstado de sesión guardado en ${statePath}`)
  console.log("Ya puedes ejecutar: npm run test:e2e\n")
})

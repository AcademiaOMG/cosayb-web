import { defineConfig, devices } from "@playwright/test"
import path from "node:path"

const STATE_PATH = path.join(process.cwd(), "tests", ".auth", "state.json")

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
    // Viewport del audit: celular real ~390×844
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      // Interactivo: corre headed y espera login manual de Google (npm run test:e2e:auth)
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        storageState: undefined,
      },
    },
    {
      // Condiciones automáticas: overflow horizontal a nivel de página/viewport
      name: "mobile-overflow",
      testMatch: /mobile-overflow\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        storageState: STATE_PATH,
      },
    },
    {
      // Sin sesión: fixtures de API para validar tarjetas, modales y vistas
      // de detalle con datos (cubre lo que la sesión real solo alcanza a mano)
      name: "data-layout",
      testMatch: /data-layout\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
})

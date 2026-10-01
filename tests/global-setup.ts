import fs from "node:fs"
import path from "node:path"
import type { FullConfig } from "@playwright/test"

/**
 * El proyecto autentica con Google OAuth (no hay formulario email/password
 * en la UI) y la sesión vive en una cookie del backend. Por eso el estado
 * se genera UNA vez de forma manual con `npm run test:e2e:auth` y se guarda
 * localmente en tests/.auth/ (gitignored — no se commitean cookies ni tokens).
 *
 * Solo se exige el estado si el run incluye proyectos que usan storageState
 * (el proyecto data-layout usa fixtures de API y no necesita sesión).
 *
 * Si el estado no existe, el run FALLA aquí con un mensaje explícito.
 * Nunca se salta el test en silencio ni se simula cobertura.
 */
export default async function globalSetup(config: FullConfig) {
  const needsSession = config.projects.some((p) => !!p.use?.storageState)
  if (!needsSession) return

  const statePath = path.join(process.cwd(), "tests", ".auth", "state.json")
  if (!fs.existsSync(statePath)) {
    throw new Error(
      [
        "Falta tests/.auth/state.json (sesión de prueba no encontrada).",
        "",
        "Para habilitar la validación automática:",
        "  1. Levanta el frontend (npm run dev) y el backend.",
        "  2. Ejecuta: npm run test:e2e:auth",
        "  3. Completa el login de Google una vez en el navegador que se abre.",
        "",
        "El archivo se guarda solo en esta máquina (gitignored).",
        "Si no es posible autenticar, la validación primaria es el checklist",
        "manual en celular real (ver plan de la tarea 8).",
      ].join("\n")
    )
  }
}

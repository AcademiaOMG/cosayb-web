import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

// Garantías estáticas del front del LMS: el contenido del instructor se muestra siempre como texto
// escapado y el cliente nunca lleva claves ni referencias a almacenamiento privado.

const ROOT = path.resolve(__dirname, "..", "..")
const TARGETS = ["components/lms", "app/(learn)", "app/(instructor)", "app/(admin)", "lib/lms"]

function files(dir: string): string[] {
  const abs = path.join(ROOT, dir)
  return readdirSync(abs).flatMap((n) => {
    const p = path.join(abs, n)
    return statSync(p).isDirectory() ? files(path.relative(ROOT, p)) : [p]
  })
}

const sources = TARGETS.flatMap(files).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f))

describe("front del LMS", () => {
  it("hay archivos que revisar", () => {
    expect(sources.length).toBeGreaterThan(15)
  })

  it("nunca inyecta HTML: sin dangerouslySetInnerHTML, innerHTML, outerHTML ni insertAdjacentHTML", () => {
    for (const f of sources) {
      const src = readFileSync(f, "utf8")
      expect(src, f).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML|\.outerHTML|insertAdjacentHTML|document\.write/)
    }
  })

  it("no contiene claves ni variables de servidor del almacenamiento", () => {
    for (const f of sources) {
      const src = readFileSync(f, "utf8")
      expect(src, f).not.toMatch(/SUPABASE_SERVICE_KEY|LMS_MEDIA_SECRET|service_role|SERVICE_KEY/)
      expect(src, f).not.toMatch(/NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE)/)
    }
  })

  it("el cliente no conoce el modelo de respuestas correctas del estudiante", () => {
    // El estudio del instructor (components/lms/studio, app/(learn)/instructor) sí maneja las respuestas correctas: es de uso exclusivo del instructor.
    const instructorSide = [path.join("components", "lms", "studio"), path.join("app", "(learn)", "instructor"), path.join("lib", "lms", "studio.ts")]
    const studentSide = sources.filter((f) => !instructorSide.some((p) => f.includes(p)) && !f.endsWith("types.ts") && !f.endsWith("api.ts") && !f.endsWith("validation.ts"))
    expect(studentSide.some((f) => f.includes(path.join("app", "(learn)", "evaluacion")))).toBe(true) // la pantalla del estudiante SÍ se revisa
    for (const f of studentSide) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/isCorrect|correctOption/)
    }
  })

  it("no afirma que el video no pueda copiarse ni usa trucos de bloqueo en el navegador", () => {
    for (const f of sources) {
      const src = readFileSync(f, "utf8")
      expect(src, f).not.toMatch(/contextmenu|oncontextmenu|controlsList|disablePictureInPicture|imposible (copiar|descargar)/i)
    }
  })
})

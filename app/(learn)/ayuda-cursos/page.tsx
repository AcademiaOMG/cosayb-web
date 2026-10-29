import type { Metadata } from "next"
import Link from "next/link"
import { Card, PageHeader } from "@/components/lms/ui"

export const metadata: Metadata = { title: "Ayuda" }

const FAQ: [string, string][] = [
  ["¿Cómo me matriculo en un curso?", "La matrícula la otorga el equipo de Academia OMG, o se incluye si tu negocio tiene el plan Academia. Entra al curso y usa el botón Inscribirme para solicitarla."],
  ["¿Cómo obtengo mi certificado?", "Completa todas las lecciones del curso y aprueba las evaluaciones obligatorias. El certificado se emite automáticamente y aparece en la sección Certificados."],
  ["¿Puedo repetir una evaluación?", "Sí, hasta el número de intentos que defina cada curso. Se conserva tu mejor nota."],
  ["¿Cómo verifico un certificado?", "Escribe el código del certificado en la página de verificación pública. Solo se muestran el nombre, el curso y la fecha de emisión."],
  ["No puedo ver un video", "Los videos usan enlaces temporales. Si dejó de reproducirse, recarga la lección: se genera un enlace nuevo. Si persiste, escríbenos."],
]

export default function AyudaPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Ayuda" subtitle="Respuestas rápidas sobre cursos, evaluaciones y certificados." />
      <div className="flex flex-col gap-3">
        {FAQ.map(([q, a]) => (
          <Card key={q} className="p-0">
            <details className="group p-5">
              <summary className="cursor-pointer list-none font-extrabold marker:hidden">{q}</summary>
              <p className="mt-2 text-sm" style={{ color: "var(--l-ink-2)" }}>{a}</p>
            </details>
          </Card>
        ))}
      </div>
      <p className="text-sm" style={{ color: "var(--l-muted)" }}>
        ¿Necesitas algo más? <Link href="/contacto" className="font-bold underline" style={{ color: "var(--l-brand)" }}>Escríbenos</Link>.
      </p>
    </div>
  )
}

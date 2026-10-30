import Link from "next/link"
import { ArrowLeft, Eye } from "lucide-react"
import type { CourseStatus } from "@/lib/lms/types"

const STATUS_ES: Record<CourseStatus, string> = { draft: "borrador", published: "publicado", archived: "archivado" }

/**
 * Franja de la "vista de instructor": el propietario (o un administrador) está viendo el curso EXACTAMENTE como lo
 * vería un estudiante. Nada de lo que haga se guarda ni cuenta (avance, intentos, certificados, analítica).
 */
export default function InstructorBanner({ backHref, status, what = "este curso" }: { backHref?: string; status?: CourseStatus; what?: string }) {
  return (
    <div role="status" className="l-no-print flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border px-4 py-3" style={{ background: "var(--l-amber-bg)", borderColor: "var(--l-amber)", color: "var(--l-amber-ink)" }}>
      <Eye size={18} aria-hidden="true" className="shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        <strong className="font-extrabold">Vista de instructor: estás viendo {what}{status ? ` (${STATUS_ES[status]})` : ""} como lo ve un estudiante.</strong>{" "}
        Tu avance e intentos de prueba no se guardan ni cuentan para nadie.
      </p>
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-extrabold underline">
          <ArrowLeft size={14} aria-hidden="true" /> Volver al estudio
        </Link>
      )}
    </div>
  )
}

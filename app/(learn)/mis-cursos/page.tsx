"use client"

import Link from "next/link"
import { Award, GraduationCap } from "lucide-react"
import Card from "@/components/ui/Card"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import ProgressBar from "@/components/lms/ProgressBar"
import SignInRequired from "@/components/lms/SignInRequired"
import { fmtDate } from "@/lib/saas/format"
import { errorStatus, useMyCertificates, useMyCourses } from "@/lib/lms/hooks"

export default function MisCursosPage() {
  const { data: courses, error, mutate } = useMyCourses()
  const { data: certs } = useMyCertificates()

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tus cursos y certificados." />

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>Mis cursos</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tu avance y tus certificados.</p>
      </header>

      <section aria-labelledby="en-curso" className="flex flex-col gap-3">
        <h2 id="en-curso" className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>MATRICULADO</h2>
        {error ? (
          <ErrorState title="No pudimos cargar tus cursos" onRetry={() => mutate()} />
        ) : !courses ? (
          <LoadingBlock className="py-8" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={28} />}
            title="Aún no estás matriculado en ningún curso"
            description="Explora el catálogo. Los negocios con plan Academia acceden a los cursos incluidos desde su página."
            action={<Link href="/cursos" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>Ver cursos</Link>}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-3">
                  <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{c.title}</h3>
                  <ProgressBar completed={c.completedCount} total={c.lessonCount} />
                  <Link href={`/aprender/${c.slug}`} className="mt-auto inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                    {c.completedCount > 0 ? "Continuar" : "Empezar"}
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="certificados" className="flex flex-col gap-3">
        <h2 id="certificados" className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>CERTIFICADOS</h2>
        {!certs ? null : certs.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cuando apruebes un curso, tu certificado aparecerá aquí.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {certs.map((c) => (
              <li key={c.id}>
                <Link href={`/certificados/${c.id}`} className="flex items-center gap-3 rounded-xl p-4" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
                  <Award size={20} aria-hidden="true" style={{ color: "var(--accent)" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.courseTitle}</span>
                    <span className="block text-xs" style={{ color: "var(--text-muted)" }}>Emitido el {fmtDate(c.issuedAt, "short")} · {c.code}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

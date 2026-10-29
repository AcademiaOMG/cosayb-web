"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { CheckCircle2, Eye, Lock } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Card from "@/components/ui/Card"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import ProgressBar from "@/components/lms/ProgressBar"
import { authClient } from "@/lib/auth"
import { buildLoginUrl } from "@/lib/authRedirect"
import { errorStatus, useCourse } from "@/lib/lms/hooks"

export default function CursoDetallePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: course, error, mutate } = useCourse(slug)
  const { data: session } = authClient.useSession()

  if (errorStatus(error) === 404) {
    return <ErrorState title="Curso no disponible" description="Este curso no existe o aún no está publicado." />
  }
  if (error) return <ErrorState title="No pudimos cargar el curso" onRetry={() => mutate()} />
  if (!course) return <LoadingBlock className="py-12" />

  const first = course.modules.flatMap((m) => m.lessons)[0]
  const lessonTotal = course.modules.reduce((n, m) => n + m.lessons.length, 0)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {course.includedInAcademia && <Badge variant="accent">Incluido en el plan Academia</Badge>}
            <Badge variant="muted">{lessonTotal} lecciones</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold text-balance sm:text-3xl" style={{ color: "var(--text-primary)" }}>{course.title}</h1>
          <p className="whitespace-pre-wrap break-words text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>{course.description}</p>
        </header>

        <section aria-labelledby="contenido" className="flex flex-col gap-3">
          <h2 id="contenido" className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>CONTENIDO</h2>
          {course.modules.map((m) => (
            <Card key={m.id} className="!p-4">
              <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</h3>
              <ul className="flex flex-col gap-1">
                {m.lessons.map((l) => {
                  const open = course.access.canViewAll || l.isPreview
                  const Icon = l.completed ? CheckCircle2 : open ? Eye : Lock
                  const row = (
                    <span className="flex items-center gap-2 text-sm" style={{ color: open ? "var(--text-primary)" : "var(--text-muted)" }}>
                      <Icon size={16} aria-hidden="true" style={{ color: l.completed ? "var(--success, #059669)" : undefined }} />
                      <span className="min-w-0 flex-1 break-words">{l.title}</span>
                      {l.isPreview && !course.access.canViewAll && <Badge variant="success">Vista previa</Badge>}
                    </span>
                  )
                  return (
                    <li key={l.id}>
                      {open && session ? (
                        <Link href={`/aprender/${course.slug}?l=${l.id}`} className="block rounded-lg px-2 py-1.5 hover:underline">{row}</Link>
                      ) : (
                        <div className="px-2 py-1.5">{row}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
        <Card>
          {course.access.canViewAll ? (
            <div className="flex flex-col gap-4">
              {course.progress && <ProgressBar completed={course.progress.completed} total={course.progress.total} />}
              <Link href={`/aprender/${course.slug}`} className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                {course.progress && course.progress.completed > 0 ? "Continuar el curso" : "Empezar el curso"}
              </Link>
              {course.access.viaAcademia && !course.access.enrolled && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Acceso incluido por el plan Academia de tu negocio.</p>
              )}
            </div>
          ) : !session ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Inicia sesión para ver si tienes acceso a este curso.</p>
              <Link href={buildLoginUrl(`/cursos/${course.slug}`)} className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                Iniciar sesión
              </Link>
              <Link href="/register" className="text-center text-sm underline" style={{ color: "var(--text-muted)" }}>Crear una cuenta</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Aún no tienes acceso</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                El acceso se otorga con una matrícula{course.includedInAcademia ? " o con el plan Academia de tu negocio" : ""}. Escríbenos y te ayudamos.
              </p>
              <Link href="/contacto" className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                Solicitar acceso
              </Link>
              {course.includedInAcademia && <Link href="/planes" className="text-center text-sm underline" style={{ color: "var(--text-muted)" }}>Ver planes</Link>}
              {first?.isPreview && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Puedes ver gratis las lecciones marcadas como vista previa.</p>}
            </div>
          )}
        </Card>
      </aside>
    </div>
  )
}

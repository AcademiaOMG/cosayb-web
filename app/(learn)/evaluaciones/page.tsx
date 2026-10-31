"use client"

import Link from "next/link"
import useSWR from "swr"
import { ClipboardCheck, RotateCcw } from "lucide-react"
import { authClient } from "@/lib/auth"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import SignInRequired from "@/components/lms/SignInRequired"
import Cover from "@/components/lms/art/Cover"
import { Badge, Card, Donut, EmptyState, ErrorPanel, LinkButton, PageHeader, Skeleton, rise } from "@/components/lms/ui"

/** Todas las evaluaciones de los cursos en los que estás matriculado. */
async function loadAll() {
  const mine = await lms.myCourses()
  const per = await Promise.all(mine.map(async (c) => ({ course: c, quizzes: await lms.courseQuizzes(c.id).catch(() => []) })))
  return per.flatMap((p) => p.quizzes.filter((q) => q.questionCount > 0).map((q) => ({ q, course: p.course })))
}

export default function EvaluacionesPage() {
  const { data: session, isPending } = authClient.useSession()
  const { data, error, mutate } = useSWR(session ? "lms/all-quizzes" : null, loadAll, { revalidateOnFocus: false })

  if ((!isPending && !session) || errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tus evaluaciones." />
  if (error) return <ErrorPanel onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Evaluaciones" subtitle="Pon a prueba lo aprendido. La nota mínima y los intentos dependen de cada curso." />
      {!data ? (
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 !rounded-[22px]" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState art={<span className="block w-56 overflow-hidden rounded-3xl"><Cover coverKey="menu" className="block h-auto w-full" /></span>} title="Aún no tienes evaluaciones" description="Aparecerán aquí cuando los cursos en los que estás matriculado las incluyan." action={<LinkButton href="/cursos">Ver catálogo</LinkButton>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map(({ q, course }, i) => {
            const left = q.maxAttempts === null ? null : Math.max(q.maxAttempts - q.attemptsUsed, 0)
            return (
              <Card key={q.id} hover className="l-rise flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap" style={rise(i % 8)}>
                <Donut value={q.bestScore ?? 0} tone={q.passed ? "mint" : q.attemptsUsed ? "amber" : "neutral"} size={64} label="Mejor nota" index={i % 8} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold" style={{ color: "var(--l-muted)" }}>{course.title}</p>
                  <p className="truncate font-extrabold">{q.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {q.passed ? <Badge tone="mint">Aprobada</Badge> : q.attemptsUsed ? <Badge tone="amber">Reintentar</Badge> : <Badge tone="rose">Pendiente</Badge>}
                    <Badge tone="neutral">{q.questionCount} preguntas</Badge>
                    {left !== null && <Badge tone="neutral">{left} intentos</Badge>}
                  </div>
                </div>
                {left === 0 && !q.passed ? <span className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Sin intentos</span> : (
                  <Link href={`/evaluacion/${q.id}`} className="l-btn l-btn-soft l-btn-sm" aria-label={`${q.attemptsUsed ? "Reintentar" : "Presentar"} ${q.title}`}>
                    {q.attemptsUsed ? <RotateCcw size={15} aria-hidden="true" /> : <ClipboardCheck size={15} aria-hidden="true" />}
                    {q.passed ? "Revisar" : q.attemptsUsed ? "Reintentar" : "Presentar"}
                  </Link>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

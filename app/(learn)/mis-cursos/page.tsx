"use client"

import { useState } from "react"
import { LayoutGrid, List } from "lucide-react"
import { authClient } from "@/lib/auth"
import { errorStatus, useMyCourses } from "@/lib/lms/hooks"
import { LEVEL_LABEL } from "@/lib/lms/format"
import SignInRequired from "@/components/lms/SignInRequired"
import Cover from "@/components/lms/art/Cover"
import { CardSkeletonGrid, CourseCard, CourseRow, type CardCourse } from "@/components/lms/parts"
import { EmptyState, ErrorPanel, LinkButton, PageHeader, Tabs } from "@/components/lms/ui"

type Tab = "all" | "active" | "done"

export default function MisCursosPage() {
  const { data: session, isPending } = authClient.useSession()
  const { data, error, mutate } = useMyCourses()
  const [tab, setTab] = useState<Tab>("all")
  const [view, setView] = useState<"grid" | "list">("grid")

  if ((!isPending && !session) || errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tus cursos." />
  if (error) return <ErrorPanel title="No pudimos cargar tus cursos" onRetry={() => mutate()} />

  const cards: (CardCourse & { finished: boolean })[] = (data ?? []).map((c) => ({
    slug: c.slug,
    title: c.title,
    coverKey: c.coverKey,
    level: c.level,
    tags: [LEVEL_LABEL[c.level], c.category],
    durationMinutes: c.durationMinutes,
    lessonCount: c.lessonCount,
    progress: { done: c.completedCount, total: c.lessonCount },
    finished: c.lessonCount > 0 && c.completedCount >= c.lessonCount,
  }))
  const shown = cards.filter((c) => (tab === "all" ? true : tab === "done" ? c.finished : !c.finished))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mis cursos" subtitle="Todo lo que estás estudiando, con tu avance." actions={<LinkButton href="/cursos" variant="soft">Explorar catálogo</LinkButton>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Filtrar mis cursos" value={tab} onChange={setTab} tabs={[{ id: "all", label: "Todos", count: cards.length }, { id: "active", label: "En curso", count: cards.filter((c) => !c.finished).length }, { id: "done", label: "Completados", count: cards.filter((c) => c.finished).length }]} />
        <div className="l-seg" role="tablist" aria-label="Vista">
          <button type="button" role="tab" aria-selected={view === "grid"} aria-label="Vista de cuadrícula" onClick={() => setView("grid")}><LayoutGrid size={16} aria-hidden="true" /></button>
          <button type="button" role="tab" aria-selected={view === "list"} aria-label="Vista de lista" onClick={() => setView("list")}><List size={16} aria-hidden="true" /></button>
        </div>
      </div>
      {!data ? (
        <CardSkeletonGrid n={3} />
      ) : shown.length === 0 ? (
        <EmptyState
          art={<span className="block w-56 overflow-hidden rounded-3xl"><Cover coverKey="inventario" className="block h-auto w-full" /></span>}
          title={cards.length === 0 ? "Aún no tienes cursos" : tab === "done" ? "Todavía no completas ningún curso" : "No tienes cursos en curso"}
          description={cards.length === 0 ? "Cuando te matriculen aparecerán aquí. Mientras tanto, explora el catálogo." : "Sigue avanzando: cada lección cuenta."}
          action={<LinkButton href="/cursos">Ver catálogo</LinkButton>}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((c, i) => <CourseCard key={c.slug} c={c} index={i % 9} />)}</div>
      ) : (
        <div className="flex flex-col gap-3">{shown.map((c, i) => <CourseRow key={c.slug} c={c} index={i % 9} />)}</div>
      )}
    </div>
  )
}

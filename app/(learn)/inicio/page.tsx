"use client"

import { useState } from "react"
import Link from "next/link"
import { Award, CalendarCheck, ClipboardCheck, GraduationCap, Play, Sparkles } from "lucide-react"
import { authClient } from "@/lib/auth"
import { errorStatus, useMyCourses, useSummary } from "@/lib/lms/hooks"
import { pct, toneForPct } from "@/lib/lms/format"
import ActivityCalendar from "@/components/lms/ActivityCalendar"
import CountUp from "@/components/lms/fx/CountUp"
import Cover from "@/components/lms/art/Cover"
import SignInRequired from "@/components/lms/SignInRequired"
import { CourseThumb } from "@/components/lms/parts"
import { Badge, Card, Donut, EmptyState, ErrorPanel, LinkButton, ProgressBar, Skeleton, Tabs, TONE, rise, type Tone } from "@/components/lms/ui"

function StatusCard({ tone, icon, value, total, label, caption, index }: { tone: Tone; icon: React.ReactNode; value: number; total: number; label: string; caption: string; index: number }) {
  const p = pct(value, total)
  return (
    <div className="l-rise relative overflow-hidden rounded-[22px] p-5" style={{ background: TONE[tone].bg, ...rise(index) }}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: TONE[tone].fg }} aria-hidden="true">{icon}</span>
        <Donut value={p} tone={tone} size={58} stroke={7} label={label} index={index} />
      </div>
      <p className="mt-4 text-4xl font-extrabold leading-none" style={{ color: TONE[tone].ink }}><CountUp to={value} /></p>
      <p className="mt-1 font-extrabold">{label}</p>
      <p className="text-xs font-bold" style={{ color: TONE[tone].ink }}>{caption.replace("{n}", String(total))}</p>
    </div>
  )
}

export default function InicioPage() {
  const { data: session, isPending } = authClient.useSession()
  const { data: s, error, mutate } = useSummary()
  const { data: mine } = useMyCourses()
  const [tab, setTab] = useState<"active" | "done">("active")

  if (!isPending && !session) return <SignInRequired message="Inicia sesión para ver tu progreso." />
  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para ver tu progreso." />
  if (error) return <ErrorPanel onRetry={() => mutate()} />

  const first = (session?.user?.name ?? "").split(" ")[0]
  const courses = mine ?? []
  const done = courses.filter((c) => c.lessonCount > 0 && c.completedCount >= c.lessonCount)
  const active = courses.filter((c) => !done.includes(c))
  const rows = tab === "active" ? active : done

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="l-rise">
          <h1 className="text-2xl font-extrabold sm:text-3xl">Hola{first ? `, ${first}` : ""}</h1>
          <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esto es lo que llevas en Academia OMG.</p>
        </header>

        {/* Continúa donde lo dejaste */}
        {!s ? (
          <Skeleton className="h-36 w-full !rounded-[22px]" />
        ) : s.resume ? (
          <Card className="l-rise flex flex-col gap-4 p-4 sm:flex-row sm:items-center" style={rise(1)}>
            <div className="hidden w-48 shrink-0 overflow-hidden rounded-2xl sm:block" style={{ aspectRatio: "400 / 190" }}>
              <Cover coverKey={s.resume.coverKey} className="block h-full w-full" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge tone="brand">Continúa donde lo dejaste</Badge>
              <h2 className="mt-1.5 truncate text-lg font-extrabold">{s.resume.title}</h2>
              <p className="truncate text-sm" style={{ color: "var(--l-muted)" }}>Siguiente: {s.resume.lessonTitle}</p>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={pct(s.resume.completed, s.resume.total)} tone="brand" label={`Avance de ${s.resume.title}`} />
                <span className="shrink-0 text-xs font-extrabold">{pct(s.resume.completed, s.resume.total)}%</span>
              </div>
            </div>
            <LinkButton href={`/aprender/${s.resume.slug}${s.resume.lessonId ? `?l=${s.resume.lessonId}` : ""}`} className="shrink-0"><Play size={16} aria-hidden="true" /> Continuar</LinkButton>
          </Card>
        ) : (
          <EmptyState art={<Sparkles size={34} style={{ color: "var(--l-tint)" }} aria-hidden="true" />} title={courses.length ? "¡Terminaste todo lo pendiente!" : "Aún no tienes cursos"} description={courses.length ? "Explora el catálogo para seguir aprendiendo." : "Explora el catálogo y pide tu matrícula para empezar."} action={<LinkButton href="/cursos">Explorar catálogo</LinkButton>} />
        )}

        {/* Estado */}
        <section aria-labelledby="estado" className="flex flex-col gap-3">
          <h2 id="estado" className="text-lg font-extrabold">Tu estado</h2>
          {!s ? (
            <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 !rounded-[22px]" />)}</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatusCard index={2} tone="amber" icon={<GraduationCap size={22} />} value={s.lessons.completed} total={s.lessons.total} label="Lecciones" caption="de {n} completadas" />
              <StatusCard index={3} tone="rose" icon={<ClipboardCheck size={22} />} value={s.quizzes.passed} total={s.quizzes.total} label="Evaluaciones" caption="de {n} aprobadas" />
              <StatusCard index={4} tone="mint" icon={<Award size={22} />} value={s.certificates.count} total={s.certificates.total} label="Certificados" caption="de {n} cursos" />
            </div>
          )}
        </section>

        {/* Mis cursos */}
        <Card className="l-rise p-5" style={rise(5)}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Mis cursos</h2>
            <Link href="/mis-cursos" className="text-sm font-bold" style={{ color: "var(--l-brand)" }}>Ver todos</Link>
          </div>
          <Tabs label="Estado de mis cursos" value={tab} onChange={setTab} tabs={[{ id: "active", label: "Activos", count: active.length }, { id: "done", label: "Completados", count: done.length }]} />
          <ul className="mt-2 divide-y" style={{ borderColor: "var(--l-line)" }}>
            {!mine && [0, 1, 2].map((i) => <li key={i} className="py-3"><Skeleton className="h-12 w-full" /></li>)}
            {mine && rows.length === 0 && <li className="py-8 text-center text-sm" style={{ color: "var(--l-muted)" }}>{tab === "active" ? "No tienes cursos en curso." : "Aún no completas ningún curso."}</li>}
            {rows.slice(0, 8).map((c, i) => {
              const p = pct(c.completedCount, c.lessonCount)
              return (
                <li key={c.id}>
                  <Link href={`/cursos/${c.slug}`} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-2xl px-1 py-3 transition-colors hover:bg-[var(--l-bg)] sm:grid-cols-[auto_1.4fr_1fr_auto]">
                    <CourseThumb coverKey={c.coverKey} size={44} />
                    <span className="min-w-0"><span className="block truncate font-extrabold">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.completedCount}/{c.lessonCount} lecciones</span></span>
                    <span className="col-span-2 sm:col-span-1"><ProgressBar value={p} tone={toneForPct(p)} label={`Avance de ${c.title}`} index={i} /></span>
                    <span className="hidden w-12 text-right text-sm font-extrabold sm:block">{p}%</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <ActivityCalendar activity={s?.activity ?? []} streak={s?.streak ?? 0} />
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-extrabold">Próximos</h2>
          {!s ? <Skeleton className="h-28 w-full" /> : s.upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--l-muted)" }}>Nada pendiente por ahora.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {s.upcoming.slice(0, 6).map((u) => (
                <li key={`${u.kind}${u.id}`}>
                  <Link href={u.kind === "lesson" ? `/aprender/${u.courseSlug}?l=${u.id}` : `/evaluacion/${u.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-[var(--l-bg)]">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: u.kind === "lesson" ? TONE.amber.bg : TONE.rose.bg, color: u.kind === "lesson" ? TONE.amber.ink : TONE.rose.ink }} aria-hidden="true">
                      {u.kind === "lesson" ? <CalendarCheck size={20} /> : <ClipboardCheck size={20} />}
                    </span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{u.title}</span><span className="block truncate text-xs" style={{ color: "var(--l-muted)" }}>{u.courseTitle}</span></span>
                    <Badge tone={u.kind === "lesson" ? "amber" : "rose"}>{u.kind === "lesson" ? "Lección" : "Evaluación"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

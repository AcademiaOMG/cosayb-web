"use client"

import Link from "next/link"
import { Award, BarChart3, BookOpen, Clock, Users } from "lucide-react"
import Cover from "./art/Cover"
import SpotlightCard from "./fx/SpotlightCard"
import { Badge, Donut, ProgressBar, rise, type Tone } from "./ui"
import { LEVEL_LABEL, durationLabel, isNew, pct, toneForPct } from "@/lib/lms/format"
import type { CatalogCourse, CourseLevel, CourseStatus } from "@/lib/lms/types"

export function CourseThumb({ coverKey, size = 48, rounded = 14 }: { coverKey: string; size?: number; rounded?: number }) {
  return (
    <span className="inline-block shrink-0 overflow-hidden" style={{ width: size, height: size, borderRadius: rounded }}>
      <Cover coverKey={coverKey} className="block h-full w-full" />
    </span>
  )
}

const LEVEL_TONE: Record<CourseLevel, Tone> = { beginner: "mint", intermediate: "amber", advanced: "rose" }
export const LevelBadge = ({ level }: { level: CourseLevel }) => <Badge tone={LEVEL_TONE[level]}>{LEVEL_LABEL[level]}</Badge>

const STATUS: Record<CourseStatus, { label: string; tone: Tone }> = {
  draft: { label: "Borrador", tone: "amber" },
  published: { label: "Publicado", tone: "mint" },
  archived: { label: "Archivado", tone: "neutral" },
}
export const StatusBadge = ({ status }: { status: CourseStatus }) => <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>

export interface CardCourse {
  slug: string
  href?: string
  title: string
  coverKey: string
  level: CourseLevel
  tags: string[]
  durationMinutes: number
  lessonCount: number
  enrolledCount?: number
  createdAt?: string
  status?: CourseStatus
  /** Si se pasa, se muestra el avance del estudiante en lugar de las métricas del catálogo. */
  progress?: { done: number; total: number }
  instructorName?: string
}

export function toCardCourse(c: CatalogCourse): CardCourse {
  return { ...c }
}

/** Tarjeta de catálogo (referencia Fikri): portada ilustrada con badges, título, indicadores y etiquetas. */
export function CourseCard({ c, index = 0 }: { c: CardCourse; index?: number }) {
  const p = c.progress ? pct(c.progress.done, c.progress.total) : null
  return (
    <SpotlightCard className="l-card l-card-hover l-rise flex h-full flex-col p-2" style={rise(index)}>
      <Link href={c.href ?? `/cursos/${c.slug}`} className="flex h-full flex-col rounded-[18px] focus-visible:outline-offset-4" aria-label={c.title}>
        <span className="relative block overflow-hidden rounded-[18px]" style={{ aspectRatio: "400 / 190" }}>
          <Cover coverKey={c.coverKey} className="block h-full w-full" />
          <span className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {c.status === "draft" && <Badge tone="amber">Borrador</Badge>}
            {c.createdAt && isNew(c.createdAt) && c.status !== "draft" && <Badge tone="rose">Nuevo</Badge>}
            {c.enrolledCount !== undefined && (
              <span className="l-badge" style={{ background: "rgba(28,26,58,.78)", color: "#fff" }}>
                <Users size={12} aria-hidden="true" /> {c.enrolledCount} {c.enrolledCount === 1 ? "inscrito" : "inscritos"}
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-3 px-3 pb-3 pt-3.5">
          <span className="line-clamp-2 min-h-[2.8em] text-[17px] font-extrabold leading-snug">{c.title}</span>
          <span className="flex items-center gap-4 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>
            <span className="inline-flex items-center gap-1"><BookOpen size={14} aria-hidden="true" /> {c.lessonCount} lecciones</span>
            <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {durationLabel(c.durationMinutes)}</span>
          </span>
          <span className="flex items-center gap-3">
            {p !== null ? (
              <>
                <Donut value={p} tone={toneForPct(p)} size={44} stroke={6} label="Avance" index={index} />
                <span className="flex-1">
                  <span className="mb-1 block text-xs font-bold" style={{ color: "var(--l-muted)" }}>Avance · {c.progress!.done}/{c.progress!.total}</span>
                  <ProgressBar value={p} tone={toneForPct(p)} label={`Avance de ${c.title}`} index={index} />
                </span>
              </>
            ) : (
              <span className="flex flex-wrap items-center gap-1.5">
                <LevelBadge level={c.level} />
                {c.tags.slice(0, 2).map((t) => (
                  <span key={t} className="l-badge" style={{ background: "var(--l-bg)", color: "var(--l-ink-2)" }}>{t}</span>
                ))}
              </span>
            )}
          </span>
        </span>
      </Link>
    </SpotlightCard>
  )
}

/** Fila de lista (vista "lista" del catálogo, referencia 8). */
export function CourseRow({ c, index = 0 }: { c: CardCourse; index?: number }) {
  const p = c.progress ? pct(c.progress.done, c.progress.total) : null
  return (
    <Link href={c.href ?? `/cursos/${c.slug}`} className="l-card l-card-hover l-rise flex items-center gap-4 p-3" style={rise(index)}>
      <CourseThumb coverKey={c.coverKey} size={72} rounded={16} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-extrabold">{c.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>
          <span>{c.instructorName ?? "Academia OMG"}</span>
          <span>{c.lessonCount} lecciones</span>
          <span>{durationLabel(c.durationMinutes)}</span>
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          <LevelBadge level={c.level} />
          {c.tags.slice(0, 2).map((t) => <span key={t} className="l-badge" style={{ background: "var(--l-bg)", color: "var(--l-ink-2)" }}>{t}</span>)}
        </span>
      </span>
      {p !== null ? (
        <span className="hidden w-40 sm:block"><ProgressBar value={p} tone={toneForPct(p)} label={`Avance de ${c.title}`} index={index} /></span>
      ) : c.enrolledCount !== undefined ? (
        <span className="hidden items-center gap-1 text-xs font-bold sm:inline-flex" style={{ color: "var(--l-muted)" }}><Users size={14} aria-hidden="true" />{c.enrolledCount}</span>
      ) : null}
    </Link>
  )
}

export function CardSkeletonGrid({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando cursos">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="l-card p-2">
          <div className="l-skeleton" style={{ aspectRatio: "400 / 190", borderRadius: 18 }} />
          <div className="space-y-3 p-3">
            <div className="l-skeleton h-5 w-4/5" />
            <div className="l-skeleton h-3 w-1/2" />
            <div className="l-skeleton h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const StatIcon = { Award, BarChart3 }
